"""
app/schemas/site_config.py
Pydantic schemas for website customization (banners, featured sections).
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

# ── Site Banners ────────────────────────────────────────────────────────────

class SiteBannerBase(BaseModel):
    image_url: str = Field(..., max_length=500)
    link_url: Optional[str] = Field(None, max_length=500)
    duration: int = Field(default=5, ge=1)
    active: bool = True
    order: int = 0

class SiteBannerCreate(SiteBannerBase):
    pass

class SiteBannerUpdate(BaseModel):
    image_url: Optional[str] = Field(None, max_length=500)
    link_url: Optional[str] = Field(None, max_length=500)
    duration: Optional[int] = Field(None, ge=1)
    active: Optional[bool] = None
    order: Optional[int] = None

class SiteBannerRead(SiteBannerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# ── Site Featured Sections ──────────────────────────────────────────────────

class SiteFeaturedSectionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    active: bool = True
    order: int = 0
    layout: str = Field(default="TABS", max_length=50)
    config: dict = Field(default_factory=dict)

class SiteFeaturedSectionCreate(SiteFeaturedSectionBase):
    pass

class SiteFeaturedSectionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    active: Optional[bool] = None
    order: Optional[int] = None
    layout: Optional[str] = Field(None, max_length=50)
    config: Optional[dict] = None

class SiteFeaturedSectionRead(SiteFeaturedSectionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
