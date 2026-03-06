"""
app/models/event_log.py
EventLog model — audit trail for domain events enqueued to Redis.
"""

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin
from app.db.types import JSONBType

# All valid statuses for an event
EVENT_STATUSES = ("pending", "processing", "success", "failed", "dead")

# All valid event types (extend as integrations are added)
EVENT_TYPES = (
    # Section 1 — product/stock
    "PRODUCT_CREATED",
    "PRODUCT_UPDATED",
    "VARIANT_CREATED",
    "VARIANT_UPDATED",
    "STOCK_ADJUSTED",
    # Section 2 — WooCommerce orders
    "ORDER_RECEIVED",
    "ORDER_CREATED",
    "ORDER_UPDATED",
    "STOCK_RESERVED",
    "STOCK_RELEASED",
    "STOCK_DEDUCTED",
    "ORDER_ITEM_UNMAPPED",
    "STOCK_INSUFFICIENT",
    # Part 3 — hardening
    "WEBHOOK_FAILED",
    "ORDER_REPROCESSED",
    "RECONCILE_INCONSISTENCY",
    "RECONCILE_REPAIRED",
)


class EventLog(UUIDMixin, Base):
    __tablename__ = "event_log"

    event_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSONBType, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True
    )
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<EventLog id={self.id} type={self.event_type} status={self.status}>"
