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
    })

# Handle DATABASE_URL pre-processing for asyncpg compatibility
_db_url = settings.DATABASE_URL
if "sslmode=" in _db_url:
    _db_url = _db_url.replace("sslmode=require", "ssl=require").replace("sslmode=allow", "ssl=allow")

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
