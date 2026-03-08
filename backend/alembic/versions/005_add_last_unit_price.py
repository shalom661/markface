"""
Add last_unit_price to raw_materials

Revision ID: 005_add_last_unit_price
Revises: 41b9eceb14c2_link_materials_to_variants
Create Date: 2026-03-08
"""

from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "005_add_last_unit_price"
down_revision: Union[str, None] = "41b9eceb14c2_link_materials_to_variants"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "raw_materials",
        sa.Column(
            "last_unit_price",
            sa.Numeric(12, 2),
            nullable=False,
            server_default=sa.text("0.00"),
        ),
    )


def downgrade() -> None:
    op.drop_column("raw_materials", "last_unit_price")
