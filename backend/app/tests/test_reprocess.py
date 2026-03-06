"""
app/tests/test_reprocess.py
Integration tests for Part 3 — internal reprocess endpoint.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_log import EventLog
from app.models.inventory import Inventory
from app.models.order import InventoryMovement, Order, OrderItem


_TEST_SECRET = "test-woo-secret"
_CREATED_URL = "/api/v1/webhooks/woocommerce/order-created"
_INTERNAL_KEY = "test-internal-key"


def _make_sig(secret: str, body: bytes) -> str:
    mac = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).digest()
    return base64.b64encode(mac).decode("utf-8")


def _post_webhook(client, url, payload, secret=_TEST_SECRET):
    body = json.dumps(payload).encode("utf-8")
    sig = _make_sig(secret, body)
    return client.post(
        url,
        content=body,
        headers={"content-type": "application/json", "x-wc-webhook-signature": sig},
    )


@pytest.fixture(autouse=True)
def patch_secrets(monkeypatch):
    from app.core import config as cfg
    monkeypatch.setattr(cfg.settings, "WOO_WEBHOOK_SECRET", _TEST_SECRET)
    monkeypatch.setattr(cfg.settings, "APP_DEBUG", False)
    monkeypatch.setattr(cfg.settings, "INTERNAL_API_KEY", _INTERNAL_KEY)


@pytest.fixture()
async def order_with_reservation(client: AsyncClient, auth_headers: dict, db: AsyncSession):
    """Create a product, variant, stock, place a woo order, return ids."""
    import uuid as _uuid

    prod = await client.post("/api/v1/products", headers=auth_headers, json={"name": "Reprocess Product"})
    assert prod.status_code == 201
    pid = prod.json()["id"]

    sku = f"REPR-{_uuid.uuid4().hex[:8].upper()}"
    var = await client.post(
        f"/api/v1/products/{pid}/variants",
        headers=auth_headers,
        json={"sku": sku, "price_default": "50.00"},
    )
    assert var.status_code == 201
    variant_id = _uuid.UUID(var.json()["id"])

    # Set stock
    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == variant_id))
    inv = inv_result.scalar_one()
    inv.stock_available = 20
    inv.stock_reserved = 0
    await db.flush()

    # Place order via webhook
    woo_order_id = 77001 + hash(sku) % 10000
    payload = {
        "id": woo_order_id,
        "status": "processing",
        "currency": "BRL",
        "total": "150.00",
        "line_items": [
            {"id": 1, "sku": sku, "name": "Item", "quantity": 5, "price": "30.00", "total": "150.00"}
        ],
    }
    resp = await _post_webhook(client, _CREATED_URL, payload)
    assert resp.status_code == 200
    assert resp.json()["outcome"] == "created"

    order_id = resp.json()["order_id"]
    return _uuid.UUID(order_id), variant_id, sku


@pytest.mark.asyncio
async def test_reprocess_wrong_api_key(client: AsyncClient, order_with_reservation):
    """Wrong API key returns 401."""
    order_id, _, _ = order_with_reservation
    resp = await client.post(
        f"/internal/orders/{order_id}/reprocess",
        headers={"x-api-key": "wrong-key"},
    )
    assert resp.status_code == 401, resp.text


@pytest.mark.asyncio
async def test_reprocess_missing_order_returns_404(client: AsyncClient):
    """Non-existent order ID returns 404."""
    fake_id = uuid.uuid4()
    resp = await client.post(
        f"/internal/orders/{fake_id}/reprocess",
        headers={"x-api-key": _INTERNAL_KEY},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_reprocess_consistent_state_no_change(
    client: AsyncClient,
    db: AsyncSession,
    order_with_reservation,
):
    """When reservation is already correct, reprocess applies no deltas."""
    order_id, variant_id, sku = order_with_reservation

    resp = await client.post(
        f"/internal/orders/{order_id}/reprocess",
        headers={"x-api-key": _INTERNAL_KEY},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["order_id"] == str(order_id)
    # No deltas if reservation is already consistent
    assert data["deltas"] == []


@pytest.mark.asyncio
async def test_reprocess_fixes_incorrect_reservation(
    client: AsyncClient,
    db: AsyncSession,
    order_with_reservation,
):
    """
    Simulate inventory drift by deleting the reserve movement for the order.
    reprocess_order must detect the discrepancy (net_reserved=0 vs expected=5)
    and apply a corrective +5 reserve with FOR UPDATE lock, then emit ORDER_REPROCESSED.
    """
    order_id, variant_id, sku = order_with_reservation

    # Delete the reserve movement to simulate drift
    db.expire_all()
    from app.models.order import InventoryMovement
    mov_result = await db.execute(
        select(InventoryMovement).where(
            InventoryMovement.order_id == order_id,
            InventoryMovement.movement_type == "reserve",
        )
    )
    mov = mov_result.scalars().first()
    if mov:
        await db.delete(mov)
        await db.commit()

    resp = await client.post(
        f"/internal/orders/{order_id}/reprocess",
        headers={"x-api-key": _INTERNAL_KEY},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert len(data["deltas"]) > 0, "Expected at least one delta to be applied"
    assert data["deltas"][0]["sku"] == sku
    assert data["deltas"][0]["delta_applied"] > 0

    # ORDER_REPROCESSED event emitted for THIS order specifically
    db.expire_all()
    ev_result = await db.execute(
        select(EventLog).where(EventLog.event_type == "ORDER_REPROCESSED")
    )
    events = ev_result.scalars().all()
    matching = [e for e in events if e.payload.get("order_id") == str(order_id)]
    assert len(matching) > 0, f"No ORDER_REPROCESSED event found for order {order_id}"
