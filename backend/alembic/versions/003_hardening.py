"""
Alembic migration 003 — Part 3 Hardening:
  - CHECK constraints on inventory (stock_available >= 0, stock_reserved >= 0)
  - New webhook_events table for event-level idempotency

Revision ID: 003_hardening
Revises: 002_orders
Create Date: 2026-02-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "003_hardening"
down_revision: Union[str, None] = "002_orders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── inventory CHECK constraints ────────────────────────────────────────
    op.create_check_constraint(
        "chk_inventory_stock_available_gte_0",
        "inventory",
        "stock_available >= 0",
    )
    op.create_check_constraint(
        "chk_inventory_stock_reserved_gte_0",
        "inventory",
        "stock_reserved >= 0",
    )

    # ── webhook_events ─────────────────────────────────────────────────────
    op.create_table(
        "webhook_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("event_id", sa.String(255), nullable=False),
        sa.Column("order_id", sa.String(255), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=True),
        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'received'"),
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.UniqueConstraint("event_id", name="uq_webhook_events_event_id"),
    )
    op.create_index("ix_webhook_events_id", "webhook_events", ["id"])
    op.create_index("ix_webhook_events_event_id", "webhook_events", ["event_id"])
    op.create_index("ix_webhook_events_order_id", "webhook_events", ["order_id"])
    op.create_index("ix_webhook_events_provider", "webhook_events", ["provider"])
    op.create_index("ix_webhook_events_status", "webhook_events", ["status"])


def downgrade() -> None:
    op.drop_table("webhook_events")
    op.drop_constraint(
        "chk_inventory_stock_reserved_gte_0", "inventory", type_="check"
    )
    op.drop_constraint(
        "chk_inventory_stock_available_gte_0", "inventory", type_="check"
    )
