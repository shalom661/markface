"""
app/schemas/product.py
Pydantic v2 schemas for Product and ProductVariant.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from typing import Optional
from pydantic import BaseModel, Field, model_validator


# ── Product Materials (BOM) ──────────────────────────────────────────────────

class ProductMaterialBase(BaseModel):
    raw_material_id: uuid.UUID
    quantity: Decimal = Field(default=Decimal("1.0000"), ge=0)
    unit_override: str | None = Field(default=None, max_length=50)

class ProductMaterialCreate(ProductMaterialBase):
    pass

class ProductMaterialRead(ProductMaterialBase):
    id: uuid.UUID
    variant_id: uuid.UUID # Changed from product_id
    
    model_config = {"from_attributes": True}


# ── ProductVariant ─────────────────────────────────────────────────────────


# ── ProductVariant ─────────────────────────────────────────────────────────

class VariantCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=120)
    
    # Attributes for Size/Color
    attributes: dict = Field(default_factory=dict) # e.g. {"size": "P", "color": "Preto"}
    
    price_default: Decimal = Field(default=Decimal("0.00"), ge=0)
    cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    weight: Decimal | None = Field(default=None, ge=0)
    height: Decimal | None = Field(default=None, ge=0)
    width: Decimal | None = Field(default=None, ge=0)
    length: Decimal | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    active: bool = True
    
    # BOM per variant
    materials: list[ProductMaterialCreate] | None = None

class VariantUpdate(BaseModel):
    id: uuid.UUID | None = None # Required if updating existing variant
    sku: str | None = Field(default=None, min_length=1, max_length=120)
    attributes: dict | None = None
    price_default: Decimal | None = Field(default=None, ge=0)
    cost: Decimal | None = Field(default=None, ge=0)
    weight: Decimal | None = Field(default=None, ge=0)
    height: Decimal | None = Field(default=None, ge=0)
    width: Decimal | None = Field(default=None, ge=0)
    length: Decimal | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    active: bool | None = None
    
    # BOM updates
    materials: list[ProductMaterialCreate] | None = None

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
    image_url: str | None
    active: bool
    
    # Relationships
    materials: list[ProductMaterialRead] = []

    model_config = {"from_attributes": True}


# ── Product ────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    images: list[str] | None = Field(default_factory=list)
    active: bool = True
    is_on_website: bool = False
    
    # Manufacturing
    is_manufactured: bool = True
    internal_code: str = Field(min_length=1, max_length=120)
    supplier_code: str | None = Field(default=None, max_length=120)
    supplier_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    
    # Variants (each with its own BOM)
    variants: list[VariantCreate]

    @model_validator(mode="after")
    def check_supplier_for_resale(self) -> "ProductCreate":
        if not self.is_manufactured and not self.supplier_id:
            raise ValueError("O fornecedor é obrigatório para produtos de revenda.")
        return self

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    images: list[str] | None = None
    active: bool | None = None
    is_on_website: bool | None = None

    # Manufacturing
    is_manufactured: bool | None = None
    internal_code: str | None = Field(default=None, min_length=1, max_length=120)
    supplier_code: str | None = Field(default=None, max_length=120)
    supplier_id: uuid.UUID | None = None
    
    # Variants updates
    variants: list[VariantUpdate] | None = None

class ProductRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    images: list[str] | None
    active: bool
    is_on_website: bool
    
    # Manufacturing
    is_manufactured: bool
    internal_code: str
    supplier_code: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    variants: list[VariantRead] = []
    category: Optional["ProductCategoryRead"] = None

    model_config = {"from_attributes": True}

from app.schemas.product_category import ProductCategoryRead
ProductRead.model_rebuild()
