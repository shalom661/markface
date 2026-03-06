"""
Initial migration — creates all tables for Section 1.

Revision ID: 001_initial
Revises:
Create Date: 2026-02-25
"""

from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── products ───────────────────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("brand", sa.String(120), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
    )
    op.create_index("ix_products_id", "products", ["id"])

    # ── product_variants ───────────────────────────────────────────────────
    op.create_table(
        "product_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sku", sa.String(120), nullable=False),
        sa.Column("attributes", postgresql.JSONB(), nullable=True),
        sa.Column(
            "price_default",
            sa.Numeric(12, 2),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("cost", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("weight", sa.Numeric(10, 3), nullable=True),
        sa.Column("height", sa.Numeric(10, 3), nullable=True),
        sa.Column("width", sa.Numeric(10, 3), nullable=True),
        sa.Column("length", sa.Numeric(10, 3), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_product_variants_id", "product_variants", ["id"])
    op.create_index("ix_product_variants_sku", "product_variants", ["sku"], unique=True)
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"])

    # ── inventory ──────────────────────────────────────────────────────────
    op.create_table(
        "inventory",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "variant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("product_variants.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("stock_available", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("stock_reserved", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_inventory_id", "inventory", ["id"])
    op.create_index("ix_inventory_variant_id", "inventory", ["variant_id"])

    # ── event_log ──────────────────────────────────────────────────────────
    op.create_table(
        "event_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_error", sa.Text(), nullable=True),
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
    )
    op.create_index("ix_event_log_id", "event_log", ["id"])
    op.create_index("ix_event_log_event_type", "event_log", ["event_type"])
    op.create_index("ix_event_log_status", "event_log", ["status"])


def downgrade() -> None:
    op.drop_table("event_log")
    op.drop_table("inventory")
    op.drop_table("product_variants")
    op.drop_table("products")
    op.drop_table("users")
