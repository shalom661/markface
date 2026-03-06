"""
app/models/inventory.py
Inventory model — one row per ProductVariant.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin


class Inventory(UUIDMixin, Base):
    __tablename__ = "inventory"

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        unique=True,              # one inventory row per variant
        nullable=False,
        index=True,
    )
    stock_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    variant: Mapped["ProductVariant"] = relationship(  # type: ignore[name-defined]
        "ProductVariant", back_populates="inventory"
    )

    def __repr__(self) -> str:
        return (
            f"<Inventory variant_id={self.variant_id} "
            f"available={self.stock_available} reserved={self.stock_reserved}>"
        )
