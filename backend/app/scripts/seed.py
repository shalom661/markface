"""
app/scripts/seed.py
Bootstrap script: creates the initial admin user if it doesn't exist.
Run automatically by the API container on startup, or manually via:
  docker compose exec api python -m app.scripts.seed
"""

import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User

# Ensure all models are registered before creating tables
import app.models  # noqa: F401


async def seed() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSession = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with AsyncSession() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"[seed] Admin '{settings.ADMIN_EMAIL}' already exists — skipping.")
        else:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
            )
            session.add(admin)
            await session.commit()
            print(f"[seed] Admin user created: {settings.ADMIN_EMAIL}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
