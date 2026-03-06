import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    fields: list = Field(default_factory=list)
    active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    fields: list | None = None
    active: bool | None = None

class CategoryRead(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
