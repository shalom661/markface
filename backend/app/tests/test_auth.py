"""
app/tests/test_auth.py
Integration tests for authentication endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_email: str):
    """Admin can log in and receive a JWT token."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": "TestPass@123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_email: str):
    """Login with wrong password returns 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint(client: AsyncClient, auth_headers: dict):
    """Authenticated /me returns current user data."""
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_me_without_token(client: AsyncClient):
    """Unauthenticated /me returns 403 (HTTPBearer requires a header)."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 403
