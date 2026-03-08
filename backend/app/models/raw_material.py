"""
app/models/raw_material.py
RawMaterial model — matérias-primas com campos específicos por categoria via JSONB.
"""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.types import JSONBType


class RawMaterial(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "raw_materials"

    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_code: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    supplier_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(100), nullable=True)
    composition: Mapped[str | None] = mapped_column(String(255), nullable=True)
    minimum_order: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    category_fields: Mapped[dict | None] = mapped_column(JSONBType, nullable=True, default=dict)
    last_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    supplier: Mapped["Supplier"] = relationship(  # type: ignore[name-defined]
        "Supplier", back_populates="raw_materials", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<RawMaterial id={self.id} category={self.category!r} internal_code={self.internal_code!r}>"
