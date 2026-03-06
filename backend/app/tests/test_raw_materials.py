"""
app/tests/test_raw_materials.py
Integration tests for RawMaterial endpoints.
"""

import pytest
from httpx import AsyncClient


# ── Helper ────────────────────────────────────────────────────────────────


async def _create_supplier(client: AsyncClient, auth_headers: dict) -> str:
    """Create a supplier and return its ID."""
    resp = await client.post(
        "/api/v1/suppliers",
        headers=auth_headers,
        json={"name": "Fornecedor Teste MP"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _create_raw_material(
    client: AsyncClient,
    auth_headers: dict,
    supplier_id: str | None = None,
    **overrides,
) -> dict:
    """Create a raw material and return the response dict."""
    payload = {
        "category": "Tecido",
        "subcategory": "Malha",
        "description": "Malha algodão 30/1",
        "unit": "m",
        "color": "Branco",
        "composition": "100% Algodão",
        "minimum_order": "50.00",
        "category_fields": {
            "tipo": "Malha",
            "rendimento": "3.5",
            "largura": "1.60",
            "gramatura": "160",
        },
    }
    if supplier_id:
        payload["supplier_id"] = supplier_id
    payload.update(overrides)
    resp = await client.post(
        "/api/v1/raw-materials",
        headers=auth_headers,
        json=payload,
    )
    return resp


# ── Tests ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_raw_material(client: AsyncClient, auth_headers: dict):
    """Create a raw material returns 201 with category_fields."""
    supplier_id = await _create_supplier(client, auth_headers)
    resp = await _create_raw_material(
        client, auth_headers, supplier_id=supplier_id,
        internal_code="TEC-001",
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["category"] == "Tecido"
    assert data["color"] == "Branco"
    assert data["category_fields"]["gramatura"] == "160"
    assert data["supplier_id"] == supplier_id
    assert data["internal_code"] == "TEC-001"
    assert "id" in data


@pytest.mark.asyncio
async def test_unique_internal_code(client: AsyncClient, auth_headers: dict):
    """Duplicate internal_code returns 409."""
    resp1 = await _create_raw_material(
        client, auth_headers, internal_code="DUP-CODE-001"
    )
    assert resp1.status_code == 201

    resp2 = await _create_raw_material(
        client, auth_headers, internal_code="DUP-CODE-001"
    )
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_list_raw_materials_with_filters(client: AsyncClient, auth_headers: dict):
    """Filter by category returns correct results."""
    await _create_raw_material(client, auth_headers, internal_code="FILT-TEC")
    await _create_raw_material(
        client, auth_headers,
        category="Botão",
        internal_code="FILT-BOT",
        category_fields={"tipo": "Pressão", "tamanho": "12mm"},
    )

    # Filter by category = Tecido
    resp = await client.get(
        "/api/v1/raw-materials",
        headers=auth_headers,
        params={"category": "Tecido"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(item["category"] == "Tecido" for item in data["items"])

    # Search by internal_code
    resp2 = await client.get(
        "/api/v1/raw-materials",
        headers=auth_headers,
        params={"search": "FILT-BOT"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["total"] >= 1


@pytest.mark.asyncio
async def test_duplicate_raw_material(client: AsyncClient, auth_headers: dict):
    """POST /{id}/duplicate returns new item without internal_code."""
    supplier_id = await _create_supplier(client, auth_headers)
    create_resp = await _create_raw_material(
        client, auth_headers,
        supplier_id=supplier_id,
        internal_code="ORIG-001",
    )
    assert create_resp.status_code == 201
    original_id = create_resp.json()["id"]

    dup_resp = await client.post(
        f"/api/v1/raw-materials/{original_id}/duplicate",
        headers=auth_headers,
    )
    assert dup_resp.status_code == 201
    dup_data = dup_resp.json()
    assert dup_data["id"] != original_id
    assert dup_data["internal_code"] is None  # blank
    assert dup_data["category"] == "Tecido"
    assert dup_data["supplier_id"] == supplier_id
    assert dup_data["category_fields"]["gramatura"] == "160"


@pytest.mark.asyncio
async def test_autocomplete(client: AsyncClient, auth_headers: dict):
    """GET autocomplete returns distinct values for a field."""
    await _create_raw_material(client, auth_headers, color="Azul Royal", internal_code="AC-001")
    await _create_raw_material(client, auth_headers, color="Azul Marinho", internal_code="AC-002")
    await _create_raw_material(client, auth_headers, color="Vermelho", internal_code="AC-003")

    resp = await client.get(
        "/api/v1/raw-materials/autocomplete",
        headers=auth_headers,
        params={"field": "color", "prefix": "Azul"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["field"] == "color"
    assert len(data["values"]) >= 2
    assert all("Azul" in v for v in data["values"])


@pytest.mark.asyncio
async def test_autocomplete_invalid_field(client: AsyncClient, auth_headers: dict):
    """Autocomplete with invalid field returns 400."""
    resp = await client.get(
        "/api/v1/raw-materials/autocomplete",
        headers=auth_headers,
        params={"field": "id"},  # not allowed
    )
    assert resp.status_code == 400
