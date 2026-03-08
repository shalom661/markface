import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin
from app.schemas.purchase import PurchaseType

class Purchase(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "purchases"

    purchase_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    type: Mapped[PurchaseType] = mapped_column(SQLEnum(PurchaseType), nullable=False)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    total_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["PurchaseItem"]] = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan", lazy="selectin")
    supplier: Mapped["Supplier | None"] = relationship("Supplier") # type: ignore

class PurchaseItem(UUIDMixin, Base):
    __tablename__ = "purchase_items"

    purchase_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    raw_material_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("raw_materials.id", ondelete="SET NULL"), nullable=True)
    variant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    purchase: Mapped["Purchase"] = relationship("Purchase", back_populates="items")
    raw_material: Mapped["RawMaterial | None"] = relationship("RawMaterial") # type: ignore
    variant: Mapped["ProductVariant | None"] = relationship("ProductVariant") # type: ignore
