"""
app/tests/test_suppliers.py
Integration tests for Supplier endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_supplier(client: AsyncClient, auth_headers: dict):
    """Create a supplier returns 201 with supplier data."""
    resp = await client.post(
        "/api/v1/suppliers",
        headers=auth_headers,
        json={
            "name": "Tecidos Brasil",
            "contact_name": "João Silva",
            "phone": "(11) 99999-0000",
            "email": "joao@tecidosbrasil.com",
            "notes": "Fornecedor principal de malhas",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Tecidos Brasil"
    assert data["contact_name"] == "João Silva"
    assert data["active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_list_suppliers(client: AsyncClient, auth_headers: dict):
    """List suppliers returns paginated result."""
    # Create one first
    await client.post(
        "/api/v1/suppliers",
        headers=auth_headers,
        json={"name": "Aviamentos Express"},
    )
    resp = await client.get("/api/v1/suppliers", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_supplier_by_id(client: AsyncClient, auth_headers: dict):
    """Get supplier by ID returns supplier details."""
    create_resp = await client.post(
        "/api/v1/suppliers",
        headers=auth_headers,
        json={"name": "Zíper & Cia"},
    )
    supplier_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/suppliers/{supplier_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Zíper & Cia"


@pytest.mark.asyncio
async def test_update_supplier(client: AsyncClient, auth_headers: dict):
    """Update supplier changes the name."""
    create_resp = await client.post(
        "/api/v1/suppliers",
        headers=auth_headers,
        json={"name": "Botões Antigos"},
    )
    supplier_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/v1/suppliers/{supplier_id}",
        headers=auth_headers,
        json={"name": "Botões Modernos"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Botões Modernos"


@pytest.mark.asyncio
async def test_soft_delete_supplier(client: AsyncClient, auth_headers: dict):
    """Soft delete sets active=False."""
    create_resp = await client.post(
        "/api/v1/suppliers",
        headers=auth_headers,
        json={"name": "Fornecedor Para Deletar"},
    )
    supplier_id = create_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/v1/suppliers/{supplier_id}", headers=auth_headers
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["active"] is False
