"""
app/tests/test_products.py
Integration tests for Products and Variants endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, auth_headers: dict):
    """Create a product returns 201 with product data."""
    resp = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": "Camiseta Preta", "brand": "MarkFace", "description": "Top quality"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Camiseta Preta"
    assert data["active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_list_products(client: AsyncClient, auth_headers: dict):
    """List products returns paginated result."""
    resp = await client.get("/api/v1/products", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_variant_creates_inventory(client: AsyncClient, auth_headers: dict):
    """Creating a variant auto-creates an inventory entry with 0 stock."""
    # Create a product first
    prod_resp = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": "Tênis Air", "brand": "MarkFace"},
    )
    assert prod_resp.status_code == 201
    product_id = prod_resp.json()["id"]

    # Create a variant
    var_resp = await client.post(
        f"/api/v1/products/{product_id}/variants",
        headers=auth_headers,
        json={
            "sku": "TENIS-AIR-42",
            "price_default": "299.90",
            "cost": "150.00",
            "attributes": {"size": "42", "color": "black"},
        },
    )
    assert var_resp.status_code == 201
    variant_id = var_resp.json()["id"]

    # Check inventory was created with 0 stock
    inv_resp = await client.get(
        f"/api/v1/inventory/{variant_id}",
        headers=auth_headers,
    )
    assert inv_resp.status_code == 200
    inv = inv_resp.json()
    assert inv["stock_available"] == 0
    assert inv["variant_id"] == variant_id


@pytest.mark.asyncio
async def test_duplicate_sku_returns_409(client: AsyncClient, auth_headers: dict):
    """Creating two variants with the same SKU returns 409."""
    prod_resp = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": "Produto Dup"},
    )
    product_id = prod_resp.json()["id"]

    await client.post(
        f"/api/v1/products/{product_id}/variants",
        headers=auth_headers,
        json={"sku": "SKU-DUPL-001", "price_default": "10.00"},
    )

    resp2 = await client.post(
        f"/api/v1/products/{product_id}/variants",
        headers=auth_headers,
        json={"sku": "SKU-DUPL-001", "price_default": "10.00"},
    )
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_soft_delete_product(client: AsyncClient, auth_headers: dict):
    """Soft delete sets active=False."""
    prod_resp = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": "Produto Para Deletar"},
    )
    product_id = prod_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/v1/products/{product_id}", headers=auth_headers
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["active"] is False
