"""
app/schemas/product.py
Pydantic v2 schemas for Product and ProductVariant.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Product ────────────────────────────────────────────────────────────────


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    brand: str | None = Field(default=None, max_length=120)
    active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    brand: str | None = Field(default=None, max_length=120)
    active: bool | None = None


class ProductRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    brand: str | None
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── ProductVariant ─────────────────────────────────────────────────────────


class VariantCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=120)
    attributes: dict | None = None
    price_default: Decimal = Field(default=Decimal("0.00"), ge=0)
    cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    weight: Decimal | None = Field(default=None, ge=0)
    height: Decimal | None = Field(default=None, ge=0)
    width: Decimal | None = Field(default=None, ge=0)
    length: Decimal | None = Field(default=None, ge=0)
    active: bool = True


class VariantUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=120)
    attributes: dict | None = None
    price_default: Decimal | None = Field(default=None, ge=0)
    cost: Decimal | None = Field(default=None, ge=0)
    weight: Decimal | None = Field(default=None, ge=0)
    height: Decimal | None = Field(default=None, ge=0)
    width: Decimal | None = Field(default=None, ge=0)
    length: Decimal | None = Field(default=None, ge=0)
    active: bool | None = None


class VariantRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    sku: str
    attributes: dict | None
    price_default: Decimal
    cost: Decimal
    weight: Decimal | None
    height: Decimal | None
    width: Decimal | None
    length: Decimal | None
    active: bool

    model_config = {"from_attributes": True}
