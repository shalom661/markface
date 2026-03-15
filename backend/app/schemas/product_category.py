"""
app/schemas/product_category.py
Pydantic schemas for hierarchical Product Categories.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    active: bool = True
    show_in_menu: bool = True
    is_featured: bool = False
    order: int = 0

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    active: Optional[bool] = None
    show_in_menu: Optional[bool] = None
    is_featured: Optional[bool] = None
    order: Optional[int] = None

class ProductCategoryRead(ProductCategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    children: List["ProductCategoryRead"] = []

    model_config = {"from_attributes": True}

# For recursive typing
ProductCategoryRead.model_rebuild()
