"""
app/schemas/order.py
Pydantic schemas for WooCommerce order ingestion and order API responses.
"""

import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Woo webhook payload shapes ────────────────────────────────────────────────

class WooLineItem(BaseModel):
    """A single product line item from WooCommerce order payload."""
    id: int = 0
    name: str = ""
    sku: str = ""
    quantity: int = 1
    price: str = "0"          # Woo sends price as string
    total: str = "0"          # line total as string

    model_config = {"extra": "allow"}  # tolerant — ignore unknown Woo fields


class WooOrderPayload(BaseModel):
    """
    Top-level WooCommerce order payload.
    Only the fields we care about are declared; extras are allowed.
    """
    id: int
    status: str = "pending"
    currency: str = "BRL"
    total: str = "0"
    line_items: list[WooLineItem] = Field(default_factory=list)

    model_config = {"extra": "allow"}


# ── API response shapes ───────────────────────────────────────────────────────

class OrderItemOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    variant_id: uuid.UUID | None
    sku: str
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    channel: str
    external_id: str
    status: str
    currency: str
    total_amount: Decimal
    items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}
