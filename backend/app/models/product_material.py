"""
app/models/product_material.py
Bill of Materials (BOM) linking a manufactured Product to its RawMaterials.
"""

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

class ProductMaterial(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "product_materials"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    raw_material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Quantity of the raw material used in a single unit of the product
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=Decimal("1.0000")
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="materials")
    raw_material: Mapped["RawMaterial"] = relationship("RawMaterial")

    def __repr__(self) -> str:
        return f"<ProductMaterial product_id={self.product_id} raw_material_id={self.raw_material_id} qty={self.quantity}>"
