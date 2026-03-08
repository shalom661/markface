"""
app/models/product_material.py
Bill of Materials (BOM) linking a manufactured Product to its RawMaterials.
"""

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

class ProductMaterial(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "product_materials"

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    raw_material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Quantity of the raw material used in a single unit of this variant
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=Decimal("1.0000")
    )

    # Unit override (optional, e.g. "metros", "gramas")
    unit_override: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="materials")
    raw_material: Mapped["RawMaterial"] = relationship("RawMaterial")

    def __repr__(self) -> str:
        return f"<ProductMaterial variant_id={self.variant_id} raw_material_id={self.raw_material_id} qty={self.quantity}>"
