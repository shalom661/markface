from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class UnitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    symbol: str = Field(..., min_length=1, max_length=10)
    active: bool = True

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    symbol: str | None = Field(None, min_length=1, max_length=10)
    active: bool | None = None

class UnitRead(UnitBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
