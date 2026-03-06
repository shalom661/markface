"""
app/models/webhook_event.py
WebhookEvent model — event-level idempotency table.

Each incoming webhook is recorded here before any business logic runs.
The UNIQUE constraint on event_id is the DB-level idempotency guard.

Status values:
  received  — inserted, not yet processed
  processed — business logic completed successfully
  ignored   — already seen (idempotent duplicate)
  failed    — exception during processing
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class WebhookEvent(UUIDMixin, Base):
    __tablename__ = "webhook_events"

    provider: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    # Idempotency key — UNIQUE enforced at DB level via migration
    event_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    order_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    payload_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="received", index=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<WebhookEvent provider={self.provider} event_id={self.event_id} "
            f"status={self.status}>"
        )
