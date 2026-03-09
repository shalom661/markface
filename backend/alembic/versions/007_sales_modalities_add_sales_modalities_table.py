"""add sales modalities table

Revision ID: 007_sales_modalities
Revises: 006_finance_purchases
Create Date: 2026-03-08 21:08:32.598206
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '007_sales_modalities'
down_revision: Union[str, None] = '006_finance_purchases'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── sales_modalities ───────────────────────────────────────────────────
    op.create_table(
        'sales_modalities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('tax_percent', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('fixed_fee', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('extra_cost', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_modalities_id'), 'sales_modalities', ['id'], unique=False)

    # Populate with initial data
    op.execute("""
        INSERT INTO sales_modalities (id, created_at, updated_at, name, tax_percent, fixed_fee, extra_cost)
        VALUES 
        (gen_random_uuid(), now(), now(), 'Venda Direta (Local)', 0, 0, 0),
        (gen_random_uuid(), now(), now(), 'Mercado Livre (Normal)', 11, 5.5, 0),
        (gen_random_uuid(), now(), now(), 'Mercado Livre (Premium)', 16, 5.5, 0),
        (gen_random_uuid(), now(), now(), 'Representante', 10, 0, 0),
        (gen_random_uuid(), now(), now(), 'Entrega em Loja', 0, 0, 15)
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_sales_modalities_id'), table_name='sales_modalities')
    op.drop_table('sales_modalities')
