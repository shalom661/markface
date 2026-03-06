"""
app/db/types.py
Custom SQLAlchemy types that work across both PostgreSQL (production)
and SQLite (tests / local dev without Postgres).
"""

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator


class JSONBType(TypeDecorator):
    """
    Dialect-aware JSON/JSONB column type.

    - PostgreSQL: uses native JSONB for efficient indexing and operators.
    - SQLite / other: falls back to plain JSON.

    Usage in models:
        from app.db.types import JSONBType
        column: Mapped[dict] = mapped_column(JSONBType, nullable=True)
    """

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect: Dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_JSONB())
        return dialect.type_descriptor(JSON())
