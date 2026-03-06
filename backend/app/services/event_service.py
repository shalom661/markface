"""
app/services/event_service.py
Business logic for creating and retrieving EventLog entries.
This module is imported by product, variant and inventory services
to fire domain events automatically.
"""

import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_log import EventLog


async def create_event(
    db: AsyncSession,
    event_type: str,
    payload: dict,
) -> EventLog:
    """
    Persist a new EventLog entry with status='pending'.
    Called automatically by product/variant/inventory services.
    """
    event = EventLog(event_type=event_type, payload=payload, status="pending")
    db.add(event)
    await db.flush()
    return event


async def list_events(
    db: AsyncSession,
    status: str | None = None,
    event_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, Sequence[EventLog]]:
    """Return paginated list of events filtered by optional status/type."""
    query = select(EventLog)
    if status:
        query = query.where(EventLog.status == status)
    if event_type:
        query = query.where(EventLog.event_type == event_type)
    query = query.order_by(EventLog.created_at.desc())

    # Count total
    from sqlalchemy import func, select as sel
    count_q = sel(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginate
    items_result = await db.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    return total, items_result.scalars().all()


async def reprocess_event(db: AsyncSession, event_id: uuid.UUID) -> EventLog:
    """
    Mark an event as 'pending' again and enqueue it in Celery for processing.
    Raises 404 if event not found.
    """
    from fastapi import HTTPException, status as http_status

    result = await db.execute(select(EventLog).where(EventLog.id == event_id))
    event: EventLog | None = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Evento {event_id} não encontrado.",
        )

    # Reset status so the worker can pick it up fresh
    event.status = "pending"
    event.retry_count = event.retry_count + 1
    await db.flush()

    # Enqueue the processing task
    from app.workers.tasks import process_event_task
    process_event_task.delay(str(event_id))

    return event
