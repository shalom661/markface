"""
app/models/product.py
Product and ProductVariant models.
"""

import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.types import JSONBType


class Product(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list[str] | None] = mapped_column(JSONBType, nullable=True, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_on_website: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Manufacturing & Sourcing Fields
    is_manufactured: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    internal_code: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    supplier_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", lazy="selectin"
    )
    supplier: Mapped["Supplier | None"] = relationship("Supplier")

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r}>"


class ProductVariant(UUIDMixin, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sku: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    attributes: Mapped[dict | None] = mapped_column(JSONBType, nullable=True, default=dict)
    price_default: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    height: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    width: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    length: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    inventory: Mapped["Inventory"] = relationship(  # type: ignore[name-defined]
        "Inventory", back_populates="variant", uselist=False, lazy="selectin"
    )
    materials: Mapped[list["ProductMaterial"]] = relationship(
        "ProductMaterial", back_populates="variant", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<ProductVariant id={self.id} sku={self.sku!r}>"
