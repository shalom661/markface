"""
app/schemas/supplier.py
Pydantic v2 schemas for Supplier.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Supplier ──────────────────────────────────────────────────────────────


class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    contact_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    active: bool = True


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    contact_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    active: bool | None = None


class SupplierRead(BaseModel):
    id: uuid.UUID
    name: str
    contact_name: str | None
    phone: str | None
    email: str | None
    notes: str | None
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
