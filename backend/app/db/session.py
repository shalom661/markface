"""
app/db/session.py
Async SQLAlchemy engine and session factory.
Provides `get_session` async generator for dependency injection.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

import os
from sqlalchemy.pool import NullPool

# Detect if running in Vercel or production serverless env
IS_VERCEL = os.getenv("VERCEL") == "1" or os.getenv("APP_ENV") == "production"

# Create the async engine
# For Serverless (Vercel), we MUST disable pooling (NullPool) because
# connections cannot be reused across different function invocations.
engine_kwargs = {
    "echo": settings.APP_DEBUG,
}

if IS_VERCEL:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })

# Handle DATABASE_URL pre-processing
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Clean up common URL params that might bug asyncpg
if "?" in _db_url:
    _base_url, _params = _db_url.split("?", 1)
    # Remove prepared_statements if it was manually added or came from env
    filtered_params = "&".join([p for p in _params.split("&") if "prepared_statements" not in p])
    _db_url = f"{_base_url}?{filtered_params}" if filtered_params else _base_url

# Standardize SSL param for asyncpg
if "sslmode=" in _db_url:
    _db_url = _db_url.replace("sslmode=require", "ssl=require").replace("sslmode=allow", "ssl=allow")

# Force SSL if not present (required by Supabase)
if "ssl=" not in _db_url:
    separator = "&" if "?" in _db_url else "?"
    _db_url += f"{separator}ssl=require"

# Vercel / Supabase (PgBouncer) safe configuration
# We must disable prepared statements because PgBouncer in transaction mode
# doesn't support them.
engine_kwargs.update({
    "connect_args": {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
})

engine: AsyncEngine = create_async_engine(
    _db_url,
    **engine_kwargs
)

# Session factory — expire_on_commit=False prevents lazy-load issues
# after commit in async context.
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Async generator yielding a scoped DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
