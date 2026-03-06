"""
Alembic migration 004 — Phase 4-A: Suppliers & Raw Materials:
  - New `suppliers` table
  - New `raw_materials` table with JSONB `category_fields`

Revision ID: 004_suppliers_raw_materials
Revises: 003_hardening
Create Date: 2026-03-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "004_suppliers_raw_materials"
down_revision: Union[str, None] = "003_hardening"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── suppliers ──────────────────────────────────────────────────────────
    op.create_table(
        "suppliers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("contact_name", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
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
    op.create_index("ix_suppliers_id", "suppliers", ["id"])

    # ── raw_materials ─────────────────────────────────────────────────────
    op.create_table(
        "raw_materials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("date", sa.Date(), nullable=True),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("subcategory", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("internal_code", sa.String(100), nullable=True),
        sa.Column("supplier_code", sa.String(100), nullable=True),
        sa.Column(
            "supplier_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("suppliers.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("color", sa.String(100), nullable=True),
        sa.Column("composition", sa.String(255), nullable=True),
        sa.Column("minimum_order", sa.Numeric(12, 2), nullable=True),
        sa.Column("category_fields", postgresql.JSONB(), nullable=True),
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
        sa.UniqueConstraint("internal_code", name="uq_raw_materials_internal_code"),
    )
    op.create_index("ix_raw_materials_id", "raw_materials", ["id"])
    op.create_index("ix_raw_materials_category", "raw_materials", ["category"])
    op.create_index("ix_raw_materials_internal_code", "raw_materials", ["internal_code"])
    op.create_index("ix_raw_materials_supplier_id", "raw_materials", ["supplier_id"])


def downgrade() -> None:
    op.drop_table("raw_materials")
    op.drop_table("suppliers")
