"""
app/tests/test_inventory.py
Integration tests for inventory adjustment and event generation.
"""

import pytest
from httpx import AsyncClient


async def _create_product_and_variant(client, auth_headers, sku: str) -> str:
    """Helper: create product + variant and return variant_id."""
    prod_resp = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": f"Produto {sku}"},
    )
    product_id = prod_resp.json()["id"]

    var_resp = await client.post(
        f"/api/v1/products/{product_id}/variants",
        headers=auth_headers,
        json={"sku": sku, "price_default": "50.00"},
    )
    return var_resp.json()["id"]


@pytest.mark.asyncio
async def test_adjust_stock_delta(client: AsyncClient, auth_headers: dict):
    """Stock adjustment with delta increases stock correctly."""
    variant_id = await _create_product_and_variant(client, auth_headers, "INV-TEST-001")

    resp = await client.post(
        f"/api/v1/inventory/{variant_id}/adjust",
        headers=auth_headers,
        json={"delta": 50, "reason": "Entrada de mercadoria"},
    )
    assert resp.status_code == 200
    assert resp.json()["stock_available"] == 50


@pytest.mark.asyncio
async def test_adjust_stock_set_absolute(client: AsyncClient, auth_headers: dict):
    """Stock adjustment with set_absolute sets stock to exact value."""
    variant_id = await _create_product_and_variant(client, auth_headers, "INV-TEST-002")

    resp = await client.post(
        f"/api/v1/inventory/{variant_id}/adjust",
        headers=auth_headers,
        json={"set_absolute": 100, "reason": "Inventário físico"},
    )
    assert resp.status_code == 200
    assert resp.json()["stock_available"] == 100


@pytest.mark.asyncio
async def test_negative_stock_rejected(client: AsyncClient, auth_headers: dict):
    """Removing more stock than available returns 422."""
    variant_id = await _create_product_and_variant(client, auth_headers, "INV-TEST-003")

    # Stock starts at 0, try to subtract 10
    resp = await client.post(
        f"/api/v1/inventory/{variant_id}/adjust",
        headers=auth_headers,
        json={"delta": -10, "reason": "Test negativo"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_adjust_generates_event(client: AsyncClient, auth_headers: dict):
    """A stock adjustment creates a STOCK_ADJUSTED event in the event log."""
    variant_id = await _create_product_and_variant(client, auth_headers, "INV-TEST-004")

    await client.post(
        f"/api/v1/inventory/{variant_id}/adjust",
        headers=auth_headers,
        json={"delta": 20, "reason": "Geração de evento"},
    )

    events_resp = await client.get(
        "/api/v1/events?event_type=STOCK_ADJUSTED",
        headers=auth_headers,
    )
    assert events_resp.status_code == 200
    data = events_resp.json()
    assert data["total"] >= 1
    stock_events = [e for e in data["items"] if e["event_type"] == "STOCK_ADJUSTED"]
    assert len(stock_events) >= 1


@pytest.mark.asyncio
async def test_no_delta_and_no_absolute_returns_400(client: AsyncClient, auth_headers: dict):
    """Providing neither delta nor set_absolute returns 400."""
    variant_id = await _create_product_and_variant(client, auth_headers, "INV-TEST-005")

    resp = await client.post(
        f"/api/v1/inventory/{variant_id}/adjust",
        headers=auth_headers,
        json={"reason": "sem campo"},
    )
    assert resp.status_code == 400
