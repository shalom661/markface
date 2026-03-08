from decimal import Decimal
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from .purchase import PurchaseType

class PurchaseItemBase(BaseModel):
    raw_material_id: UUID | None = None
    variant_id: UUID | None = None
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemRead(PurchaseItemBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class PurchaseBase(BaseModel):
    purchase_date: datetime
    type: PurchaseType
    supplier_id: UUID | None = None
    total_value: Decimal
    notes: str | None = None

class PurchaseCreate(PurchaseBase):
    items: list[PurchaseItemCreate]

class PurchaseRead(PurchaseBase):
    id: UUID
    items: list[PurchaseItemRead]
    model_config = ConfigDict(from_attributes=True)

class FixedCostBase(BaseModel):
    description: str
    value: Decimal

class FixedCostCreate(FixedCostBase):
    pass

class FixedCostRead(FixedCostBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)
