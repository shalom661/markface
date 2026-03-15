"""
app/models/product_category.py
Hierarchical categories for products on the website.
"""

import uuid
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List

from app.db.base import Base, UUIDMixin, TimestampMixin

class ProductCategory(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "product_categories"

    name: Mapped[str] = mapped_column(sa.String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(sa.String(120), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    active: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)
    show_in_menu: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(sa.Boolean, default=False, nullable=False)
    order: Mapped[int] = mapped_column(sa.Integer, default=0, nullable=False)

    # Relationships
    parent: Mapped[Optional["ProductCategory"]] = relationship(
        "ProductCategory", remote_side="ProductCategory.id", back_populates="children"
    )
    children: Mapped[List["ProductCategory"]] = relationship(
        "ProductCategory", back_populates="parent", cascade="all, delete-orphan", lazy="selectin"
    )
    
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category") # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<ProductCategory name={self.name!r} slug={self.slug!r}>"
