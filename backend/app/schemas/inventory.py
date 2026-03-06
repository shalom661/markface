"""
app/schemas/inventory.py
Pydantic v2 schemas for Inventory reads and adjustment requests.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class InventoryRead(BaseModel):
    id: uuid.UUID
    variant_id: uuid.UUID
    stock_available: int
    stock_reserved: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockAdjustRequest(BaseModel):
    """
    Two modes for adjusting stock:
    - delta: add/subtract from current available stock (positive or negative int)
    - set_absolute: set stock_available to an exact value (non-negative int)
    Exactly one must be provided.
    """
    delta: int | None = None
    set_absolute: int | None = Field(default=None, ge=0)
    reason: str = Field(min_length=1, max_length=255, description="Motivo do ajuste")
