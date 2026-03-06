"""
app/tests/test_woo_webhooks.py
Integration tests for Section 2 — WooCommerce inbound webhooks.

Tests run against the real test_markface Postgres DB via the shared conftest
session/client fixtures. The schema is reset once per session.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_log import EventLog
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem


# ── Test helpers ──────────────────────────────────────────────────────────────

_TEST_SECRET = "test-woo-secret"
_CREATED_URL = "/api/v1/webhooks/woocommerce/order-created"
_CANCELLED_URL = "/api/v1/webhooks/woocommerce/order-cancelled"


def _make_sig(secret: str, body: bytes) -> str:
    """Compute the WooCommerce HMAC-SHA256 signature over raw body bytes."""
    mac = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).digest()
    return base64.b64encode(mac).decode("utf-8")


def _woo_payload(
    order_id: int = 1001,
    status: str = "processing",
    line_items: list[dict] | None = None,
) -> dict:
    """Return a minimal WooCommerce order payload dict."""
    return {
        "id": order_id,
        "status": status,
        "currency": "BRL",
        "total": "199.90",
        "line_items": line_items or [],
    }


def _post_webhook(
    client: AsyncClient,
    url: str,
    payload: dict,
    secret: str = _TEST_SECRET,
) -> "Coroutine":
    """Build and send a signed webhook POST."""
    body = json.dumps(payload).encode("utf-8")
    sig = _make_sig(secret, body)
    return client.post(
        url,
        content=body,
        headers={"content-type": "application/json", "x-wc-webhook-signature": sig},
    )


async def _set_stock(db: AsyncSession, variant_id, available: int, reserved: int = 0):
    """Helper to directly set inventory levels for a variant."""
    result = await db.execute(select(Inventory).where(Inventory.variant_id == variant_id))
    inv = result.scalar_one()
    inv.stock_available = available
    inv.stock_reserved = reserved
    await db.flush()


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture()
async def variant_with_stock(client: AsyncClient, auth_headers: dict, db: AsyncSession):
    """Create a product + variant + set stock to 10, return (variant_id, sku)."""
    import uuid as _uuid
    prod = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": "Woo Test Product"},
    )
    assert prod.status_code == 201, prod.text
    pid = prod.json()["id"]

    # Unique SKU per test to avoid UNIQUE constraint violations across tests
    sku = f"WOO-SKU-{_uuid.uuid4().hex[:8].upper()}"
    var = await client.post(
        f"/api/v1/products/{pid}/variants",
        headers=auth_headers,
        json={"sku": sku, "price_default": "99.95"},
    )
    assert var.status_code == 201, var.text
    variant_id = var.json()["id"]

    import uuid
    await _set_stock(db, uuid.UUID(variant_id), available=10)
    return variant_id, sku


# ── Patch settings so signature validation uses the test secret ───────────────

@pytest.fixture(autouse=True)
def patch_woo_secret(monkeypatch):
    """Override WOO_WEBHOOK_SECRET for every test in this module."""
    from app.core import config as cfg

    monkeypatch.setattr(cfg.settings, "WOO_WEBHOOK_SECRET", _TEST_SECRET)
    # Also patch APP_DEBUG to False so the secret guard is active
    monkeypatch.setattr(cfg.settings, "APP_DEBUG", False)


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_signature_returns_401(client: AsyncClient):
    """A webhook with a wrong signature must be rejected with 401."""
    payload = _woo_payload(order_id=9001)
    body = json.dumps(payload).encode("utf-8")
    resp = await client.post(
        _CREATED_URL,
        content=body,
        headers={
            "content-type": "application/json",
            "x-wc-webhook-signature": "totally-wrong-signature",
        },
    )
    assert resp.status_code == 401, resp.text


@pytest.mark.asyncio
async def test_order_created_creates_order_and_items(
    client: AsyncClient,
    db: AsyncSession,
    variant_with_stock,
):
    """Valid webhook creates an Order row, OrderItems, and reserves stock."""
    variant_id, sku = variant_with_stock

    payload = _woo_payload(
        order_id=2001,
        line_items=[{"id": 1, "sku": sku, "name": "Woo Prod", "quantity": 3, "price": "99.95", "total": "299.85"}],
    )
    resp = await _post_webhook(client, _CREATED_URL, payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["ok"] is True
    assert data["outcome"] == "created"

    # Order exists in DB
    result = await db.execute(select(Order).where(Order.external_id == "2001"))
    order = result.scalar_one_or_none()
    assert order is not None
    assert order.channel == "woo"

    # OrderItem created
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = items_result.scalars().all()
    assert len(items) == 1
    assert items[0].sku == sku
    assert items[0].quantity == 3

    # Stock reserved
    import uuid
    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == uuid.UUID(variant_id)))
    inv = inv_result.scalar_one()
    assert inv.stock_reserved == 3


@pytest.mark.asyncio
async def test_idempotent_same_webhook_twice(
    client: AsyncClient,
    db: AsyncSession,
    variant_with_stock,
):
    """
    Posting the exact same webhook twice (same body = same event_id hash) must be
    a no-op on the second call.

    Part 3 behaviour: second call hits WebhookEvent UNIQUE constraint and returns
    outcome='ignored' (instead of going through order-level idempotency).
    """
    variant_id, sku = variant_with_stock

    payload = _woo_payload(
        order_id=3001,
        line_items=[{"id": 1, "sku": sku, "name": "Item", "quantity": 2, "price": "50.00", "total": "100.00"}],
    )

    resp1 = await _post_webhook(client, _CREATED_URL, payload)
    assert resp1.status_code == 200
    assert resp1.json()["outcome"] == "created"

    db.expire_all()

    resp2 = await _post_webhook(client, _CREATED_URL, payload)
    assert resp2.status_code == 200
    # Part 3: WebhookEvent idempotency gate fires first → 'ignored'
    assert resp2.json()["outcome"] in ("no_change", "ignored")

    # Still only one Order
    result = await db.execute(select(Order).where(Order.external_id == "3001"))
    orders = result.scalars().all()
    assert len(orders) == 1

    # Stock reserved exactly once (2 units)
    import uuid
    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == uuid.UUID(variant_id)))
    inv = inv_result.scalar_one()
    assert inv.stock_reserved == 2


@pytest.mark.asyncio
async def test_unmapped_sku_creates_item_with_no_variant(
    client: AsyncClient,
    db: AsyncSession,
):
    """If a SKU is unknown, OrderItem is created with variant_id=None and an event is emitted."""
    payload = _woo_payload(
        order_id=4001,
        line_items=[{"id": 1, "sku": "GHOST-SKU-999", "name": "Unknown Product", "quantity": 1, "price": "10.00", "total": "10.00"}],
    )
    resp = await _post_webhook(client, _CREATED_URL, payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "GHOST-SKU-999" in data.get("unmapped_skus", [])

    # OrderItem with variant_id=None
    result = await db.execute(select(Order).where(Order.external_id == "4001"))
    order = result.scalar_one_or_none()
    assert order is not None

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = items_result.scalars().all()
    assert len(items) == 1
    assert items[0].variant_id is None

    # ORDER_ITEM_UNMAPPED event exists
    ev_result = await db.execute(
        select(EventLog).where(EventLog.event_type == "ORDER_ITEM_UNMAPPED")
    )
    ev = ev_result.scalars().first()
    assert ev is not None
    assert ev.payload.get("sku") == "GHOST-SKU-999"


@pytest.mark.asyncio
async def test_order_cancelled_releases_reservation(
    client: AsyncClient,
    db: AsyncSession,
    variant_with_stock,
):
    """After cancellation, stock_reserved is returned to its pre-order value."""
    variant_id, sku = variant_with_stock
    import uuid

    # Check initial reserved is 0
    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == uuid.UUID(variant_id)))
    inv = inv_result.scalar_one()
    initial_reserved = inv.stock_reserved  # should be 0 from fixture

    # Create order
    payload_create = _woo_payload(
        order_id=5001,
        status="processing",
        line_items=[{"id": 1, "sku": sku, "name": "Item", "quantity": 4, "price": "50.00", "total": "200.00"}],
    )
    resp = await _post_webhook(client, _CREATED_URL, payload_create)
    assert resp.status_code == 200
    assert resp.json()["outcome"] == "created"

    db.expire_all()

    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == uuid.UUID(variant_id)))
    inv = inv_result.scalar_one()
    assert inv.stock_reserved == initial_reserved + 4

    # Cancel order
    payload_cancel = _woo_payload(order_id=5001, status="cancelled")
    resp2 = await _post_webhook(client, _CANCELLED_URL, payload_cancel)
    assert resp2.status_code == 200, resp2.text
    assert resp2.json()["outcome"] == "cancelled"

    db.expire_all()

    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == uuid.UUID(variant_id)))
    inv = inv_result.scalar_one()
    assert inv.stock_reserved == initial_reserved


@pytest.mark.asyncio
async def test_insufficient_stock_emits_event_no_negative(
    client: AsyncClient,
    db: AsyncSession,
    variant_with_stock,
):
    """When stock < requested qty, STOCK_INSUFFICIENT is emitted and stock stays >= 0."""
    variant_id, sku = variant_with_stock
    import uuid

    # Force inventory to 0
    await _set_stock(db, uuid.UUID(variant_id), available=0, reserved=0)

    payload = _woo_payload(
        order_id=6001,
        line_items=[{"id": 1, "sku": sku, "name": "Item", "quantity": 5, "price": "50.00", "total": "250.00"}],
    )
    resp = await _post_webhook(client, _CREATED_URL, payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert sku in data.get("insufficient_skus", [])

    # Stock must not be negative
    db.expire_all()
    inv_result = await db.execute(select(Inventory).where(Inventory.variant_id == uuid.UUID(variant_id)))
    inv = inv_result.scalar_one()
    assert inv.stock_reserved >= 0

    # STOCK_INSUFFICIENT event emitted
    ev_result = await db.execute(
        select(EventLog).where(EventLog.event_type == "STOCK_INSUFFICIENT")
    )
    ev = ev_result.scalars().first()
    assert ev is not None
    assert ev.payload.get("sku") == sku
