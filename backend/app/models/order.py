"""
app/models/order.py
Order, OrderItem and InventoryMovement models for Section 2.
"""

import uuid
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.types import JSONBType


class Order(UUIDMixin, TimestampMixin, Base):
    """
    Represents a marketplace order ingested via webhook.
    channel + external_id must be unique (idempotency constraint).
    """
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("channel", "external_id", name="uq_orders_channel_external"),
    )

    channel: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(80), nullable=False, default="created")
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="BRL")
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    raw_payload: Mapped[dict] = mapped_column(JSONBType, nullable=False, default=dict)

    # Relationships
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Order channel={self.channel} external_id={self.external_id} status={self.status}>"


class OrderItem(UUIDMixin, Base):
    """
    A single line item within an Order.
    variant_id is nullable when the SKU cannot be mapped to a known ProductVariant.
    """
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sku: Mapped[str] = mapped_column(String(120), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    variant: Mapped["ProductVariant | None"] = relationship(  # type: ignore[name-defined]
        "ProductVariant", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<OrderItem sku={self.sku} qty={self.quantity} order_id={self.order_id}>"


class InventoryMovement(UUIDMixin, Base):
    """
    Audit trail for every stock change triggered by order events.
    movement_type: reserve | release | deduct | adjust
    """
    __tablename__ = "inventory_movements"

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    movement_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<InventoryMovement variant_id={self.variant_id} "
            f"type={self.movement_type} qty={self.quantity}>"
        )
