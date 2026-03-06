"""
app/tests/conftest.py
Pytest fixtures for async FastAPI testing with real PostgreSQL.

Architecture:
- `test_markface` Postgres DB, tables reset once via asyncio.run() (sync fixture)
- Per-test AsyncSession shared between fixtures and FastAPI route handlers
- Rollback after each test for clean isolation
- Separate `admin_email` + `admin_token` fixtures for login tests
"""

import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import asyncpg
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_session
from app.main import app

def _to_asyncpg_url(url: str) -> str:
    # asyncpg não entende "postgresql+asyncpg://"
    return url.replace("postgresql+asyncpg://", "postgresql://")

async def _ensure_test_db_exists() -> None:
    """
    Garante que o database 'test_markface' existe.
    Conecta num DB de manutenção (postgres) e cria se necessário.
    """
    base_url, _ = settings.DATABASE_URL.rsplit("/", 1)
    admin_url = _to_asyncpg_url(f"{base_url}/postgres")  # DB padrão sempre existe

    conn = await asyncpg.connect(admin_url)
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", "test_markface"
        )
        if not exists:
            # CREATE DATABASE não pode rodar dentro de transaction
            await conn.execute('CREATE DATABASE "test_markface"')
    finally:
        await conn.close()

# ── Test DB URL ───────────────────────────────────────────────────────────────
_base_url, _ = settings.DATABASE_URL.rsplit("/", 1)
TEST_DB_URL = f"{_base_url}/test_markface"

#from sqlalchemy.pool import NullPool

#test_engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
#TestSessionFactory = async_sessionmaker(
#    bind=test_engine,
#    expire_on_commit=False,
#    autoflush=True,
#    autocommit=False,
#)

from sqlalchemy.pool import NullPool

test_engine = None
TestSessionFactory = None

async def _reset_schema(engine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> None:  # type: ignore[return]
    async def _setup():
        global test_engine, TestSessionFactory

        await _ensure_test_db_exists()

        test_engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
        TestSessionFactory = async_sessionmaker(
            bind=test_engine,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False,
        )

        await _reset_schema(test_engine)

    asyncio.run(_setup())
    yield


@pytest_asyncio.fixture()
async def db() -> AsyncSession:  # type: ignore[return]
    assert TestSessionFactory is not None, "TestSessionFactory not initialized"
    async with TestSessionFactory() as session:
        yield session
        await session.rollback()


# ── FastAPI client with overridden session ────────────────────────────────────
@pytest_asyncio.fixture()
async def client(db: AsyncSession) -> AsyncClient:  # type: ignore[return]
    """
    HTTP client with get_db overridden to yield the per-test session.

    IMPORTANT: Routers use `Depends(get_db)`, not `Depends(get_session)`.
    `get_db` calls `get_session()` as a plain Python function (not via Depends),
    so overriding `get_session` would have NO EFFECT. We must override `get_db`.
    """
    from app.core.deps import get_db

    async def _override():
        yield db

    app.dependency_overrides[get_db] = _override
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Admin credentials as separate fixtures ────────────────────────────────────
@pytest_asyncio.fixture()
async def admin_email(db: AsyncSession) -> str:
    """
    Insert an admin user and return their email.
    Using a unique email per test avoids UNIQUE constraint issues.
    """
    from app.models.user import User

    email = f"admin_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        password_hash=hash_password("TestPass@123"),
        role="admin",
    )
    db.add(user)
    await db.flush()
    return email


@pytest_asyncio.fixture()
async def admin_token(db: AsyncSession, admin_email: str) -> str:
    """Return a valid JWT for the admin user created by admin_email fixture."""
    from app.models.user import User
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.email == admin_email))
    user = result.scalar_one()
    return create_access_token(str(user.id), extra_claims={"role": "admin"})


@pytest_asyncio.fixture()
async def auth_headers(admin_token: str) -> dict:
    """Authorization headers with admin JWT."""
    return {"Authorization": f"Bearer {admin_token}"}
