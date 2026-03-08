"""
app/schemas/raw_material.py
Pydantic v2 schemas for RawMaterial (Matéria-Prima).
"""

import uuid
from datetime import date as date_type, datetime
from decimal import Decimal

from pydantic import BaseModel, Field
from .supplier import SupplierRead


# ── RawMaterial ───────────────────────────────────────────────────────────


class RawMaterialCreate(BaseModel):
    date: date_type | None = None
    category: str = Field(min_length=1, max_length=100)
    subcategory: str | None = Field(default=None, max_length=100)
    description: str | None = None
    internal_code: str | None = Field(default=None, max_length=100)
    supplier_code: str | None = Field(default=None, max_length=100)
    supplier_id: uuid.UUID | None = None
    unit: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=100)
    composition: str | None = Field(default=None, max_length=255)
    minimum_order: Decimal | None = Field(default=None, ge=0)
    category_fields: dict | None = None
    last_unit_price: Decimal | None = None
    active: bool = True


class RawMaterialUpdate(BaseModel):
    date: date_type | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    subcategory: str | None = Field(default=None, max_length=100)
    description: str | None = None
    internal_code: str | None = Field(default=None, max_length=100)
    supplier_code: str | None = Field(default=None, max_length=100)
    supplier_id: uuid.UUID | None = None
    unit: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=100)
    composition: str | None = Field(default=None, max_length=255)
    minimum_order: Decimal | None = Field(default=None, ge=0)
    category_fields: dict | None = None
    last_unit_price: Decimal | None = None
    active: bool | None = None


class RawMaterialRead(BaseModel):
    id: uuid.UUID
    date: date_type | None
    category: str
    subcategory: str | None
    description: str | None
    internal_code: str | None
    supplier_code: str | None
    supplier_id: uuid.UUID | None
    unit: str | None
    color: str | None
    composition: str | None
    minimum_order: Decimal | None
    category_fields: dict | None
    last_unit_price: Decimal = Decimal("0.00")
    active: bool
    supplier: SupplierRead | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Autocomplete ──────────────────────────────────────────────────────────


class AutocompleteResponse(BaseModel):
    field: str
    values: list[str]
