"""
app/schemas/user.py
Pydantic v2 schemas for User CRUD and auth flows.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="user", pattern="^(admin|user)$")


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
