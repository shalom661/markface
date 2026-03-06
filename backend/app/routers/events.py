"""
app/routers/events.py
EventLog endpoints: list filtered events, trigger reprocessing.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.event import EventRead
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=PaginatedResponse[EventRead],
    summary="Listar eventos (filtros: status, event_type)",
)
async def list_events(
    event_status: str | None = Query(default=None, alias="status"),
    event_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[EventRead]:
    total, items = await event_service.list_events(
        db, event_status, event_type, page, page_size
    )
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.post(
    "/{event_id}/reprocess",
    response_model=EventRead,
    summary="Reenfileirar evento para reprocessamento pelo worker",
)
async def reprocess_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> EventRead:
    return await event_service.reprocess_event(db, event_id)  # type: ignore[return-value]
