"""
app/schemas/event.py
Pydantic v2 schemas for EventLog reads and reprocess requests.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel


class EventRead(BaseModel):
    id: uuid.UUID
    event_type: str
    payload: dict
    status: str
    retry_count: int
    last_error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
