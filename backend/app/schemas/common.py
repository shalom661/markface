"""
app/schemas/common.py
Shared Pydantic models used across multiple resources.
"""

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list wrapper."""
    total: int
    page: int
    page_size: int
    items: list[T]


class MessageResponse(BaseModel):
    """Simple message acknowledgement."""
    message: str
