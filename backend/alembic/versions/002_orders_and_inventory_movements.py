"""
Alembic migration 002 — Section 2: orders, order_items, inventory_movements.

Revision ID: 002_orders_and_inventory_movements
Revises: 001_initial
Create Date: 2026-02-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "002_orders"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── orders ─────────────────────────────────────────────────────────────
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("external_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(80), nullable=False, server_default="created"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="BRL"),
        sa.Column(
            "total_amount",
            sa.Numeric(12, 2),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "raw_payload",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("channel", "external_id", name="uq_orders_channel_external"),
    )
    op.create_index("ix_orders_id", "orders", ["id"])
    op.create_index("ix_orders_channel", "orders", ["channel"])
    op.create_index("ix_orders_external_id", "orders", ["external_id"])

    # ── order_items ────────────────────────────────────────────────────────
    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "variant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("product_variants.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("sku", sa.String(120), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column(
            "unit_price",
            sa.Numeric(12, 2),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "line_total",
            sa.Numeric(12, 2),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.create_index("ix_order_items_id", "order_items", ["id"])
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_variant_id", "order_items", ["variant_id"])

    # ── inventory_movements ────────────────────────────────────────────────
    op.create_table(
        "inventory_movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "variant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("product_variants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("movement_type", sa.String(40), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(255), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_inventory_movements_id", "inventory_movements", ["id"])
    op.create_index("ix_inventory_movements_variant_id", "inventory_movements", ["variant_id"])
    op.create_index("ix_inventory_movements_order_id", "inventory_movements", ["order_id"])
    op.create_index("ix_inventory_movements_type", "inventory_movements", ["movement_type"])


def downgrade() -> None:
    op.drop_table("inventory_movements")
    op.drop_table("order_items")
    op.drop_table("orders")
