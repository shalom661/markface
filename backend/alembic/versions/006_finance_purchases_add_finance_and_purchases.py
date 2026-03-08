"""add finance and purchases

Revision ID: 006_finance_purchases
Revises: 005_add_last_unit_price
Create Date: 2026-03-08 20:55:22.871295
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '006_finance_purchases'
down_revision: Union[str, None] = '005_add_last_unit_price'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create fixed_costs table
    op.create_table(
        'fixed_costs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('value', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fixed_costs_id'), 'fixed_costs', ['id'], unique=False)

    # 2. Create purchases table
    op.create_table(
        'purchases',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('purchase_date', sa.DateTime(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('supplier_id', sa.UUID(), nullable=True),
        sa.Column('total_value', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_purchases_id'), 'purchases', ['id'], unique=False)

    # 3. Create purchase_items table
    op.create_table(
        'purchase_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('purchase_id', sa.UUID(), nullable=False),
        sa.Column('raw_material_id', sa.UUID(), nullable=True),
        sa.Column('variant_id', sa.UUID(), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('total_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['purchase_id'], ['purchases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['raw_material_id'], ['raw_materials.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_purchase_items_id'), 'purchase_items', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_purchase_items_id'), table_name='purchase_items')
    op.drop_table('purchase_items')
    op.drop_index(op.f('ix_purchases_id'), table_name='purchases')
    # op.execute("DROP TYPE purchasetype;") # Optional: keeping it is safer
    op.drop_table('purchases')
    
    op.drop_index(op.f('ix_fixed_costs_id'), table_name='fixed_costs')
    op.drop_table('fixed_costs')
