"""
app/schemas/customer.py
Pydantic v2 schemas for Customer.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    tax_id: str | None = Field(default=None, max_length=50)
    address: str | None = None
    active: bool = True


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    tax_id: str | None = Field(default=None, max_length=50)
    address: str | None = None
    active: bool | None = None


class CustomerRead(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    tax_id: str | None
    address: str | None
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
