"""
app/workers/tasks.py  (Part 3 — updated)
Celery tasks:
  - process_event_task: existing event log processing (Section 1)
  - reconcile_inventory_task: new Part 3 reconciliation job (runs every 10 min)
"""

import asyncio
import uuid
from datetime import datetime, timezone

from celery.utils.log import get_task_logger

from app.workers.celery_app import celery_app

logger = get_task_logger(__name__)


# ── Section 1: Event processing ────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.tasks.process_event_task",
    max_retries=3,
    default_retry_delay=30,
)
def process_event_task(self, event_id: str) -> dict:
    """Process a single EventLog entry (mock implementation for Section 1)."""
    logger.info(f"[process_event_task] Starting — event_id={event_id}")
    try:
        result = asyncio.run(_process_event_async(event_id))
        logger.info(f"[process_event_task] Done — event_id={event_id}, result={result}")
        return result
    except Exception as exc:
        logger.error(f"[process_event_task] Failed — event_id={event_id}, error={exc}")
        asyncio.run(_mark_event_failed(event_id, str(exc)))
        raise self.retry(exc=exc)


async def _process_event_async(event_id: str) -> dict:
    """Async helper: load event, transition status, mock-process, mark success."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.event_log import EventLog

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSession = async_sessionmaker(bind=engine, expire_on_commit=False)

    try:
        async with AsyncSession() as session:
            result = await session.execute(
                select(EventLog).where(EventLog.id == uuid.UUID(event_id))
            )
            event: EventLog | None = result.scalar_one_or_none()
            if not event:
                logger.warning(f"Event {event_id} not found, skipping.")
                return {"status": "not_found", "event_id": event_id}

            event.status = "processing"
            await session.commit()

            logger.info(f"[MOCK] Processing event type={event.event_type} payload={event.payload}")
            await asyncio.sleep(0.1)

            event.status = "success"
            await session.commit()
            return {"status": "success", "event_id": event_id, "event_type": event.event_type}
    finally:
        await engine.dispose()


async def _mark_event_failed(event_id: str, error_msg: str) -> None:
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.event_log import EventLog

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSession = async_sessionmaker(bind=engine, expire_on_commit=False)
    try:
        async with AsyncSession() as session:
            result = await session.execute(
                select(EventLog).where(EventLog.id == uuid.UUID(event_id))
            )
            event: EventLog | None = result.scalar_one_or_none()
            if event:
                event.status = "failed"
                event.last_error = error_msg[:1000]
                await session.commit()
    finally:
        await engine.dispose()


# ── Part 3: Reconciliation ─────────────────────────────────────────────────────

@celery_app.task(
    name="app.workers.tasks.reconcile_inventory_task",
    max_retries=1,
)
def reconcile_inventory_task() -> dict:
    """
    Periodic reconciliation job (runs every 10 minutes via Celery Beat).

    Finds active orders (processing/on-hold) and checks whether their
    inventory reservations match the sum of their InventoryMovements.

    Soft mode (default): log inconsistencies + EventLog, no mutations.
    Repair mode (RECONCILE_REPAIR=true): apply corrective deltas with row locks.
    """
    logger.info("[reconcile_inventory_task] Starting reconciliation run")
    try:
        result = asyncio.run(_reconcile_async())
        logger.info(f"[reconcile_inventory_task] Done: {result}")
        return result
    except Exception as exc:
        logger.error(f"[reconcile_inventory_task] Failed: {exc}")
        raise


async def _reconcile_async() -> dict:
    """Async reconciliation implementation."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import select, and_
    from app.core.config import settings
    from app.models.order import Order, OrderItem, InventoryMovement
    from app.models.inventory import Inventory
    from app.services.event_service import create_event

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSession = async_sessionmaker(bind=engine, expire_on_commit=False)

    active_statuses = ("processing", "on-hold", "pending")
    inconsistencies_found = 0
    repairs_applied = 0

    try:
        async with AsyncSession() as session:
            # Load all active orders
            orders_result = await session.execute(
                select(Order).where(Order.status.in_(active_statuses))
            )
            orders = orders_result.scalars().all()

            for order in orders:
                items_result = await session.execute(
                    select(OrderItem).where(OrderItem.order_id == order.id)
                )
                items = items_result.scalars().all()

                for item in items:
                    if item.variant_id is None:
                        continue

                    # Compute net reserved for this item
                    movements_result = await session.execute(
                        select(InventoryMovement).where(
                            and_(
                                InventoryMovement.order_id == order.id,
                                InventoryMovement.variant_id == item.variant_id,
                            )
                        )
                    )
                    movements = movements_result.scalars().all()
                    net_reserved = sum(
                        m.quantity if m.movement_type == "reserve" else -m.quantity
                        for m in movements
                    )

                    if net_reserved != item.quantity:
                        delta = item.quantity - net_reserved
                        inconsistencies_found += 1
                        logger.warning(
                            f"[reconcile] Inconsistency order={order.external_id} "
                            f"sku={item.sku} expected={item.quantity} actual={net_reserved} delta={delta}"
                        )

                        await create_event(session, "RECONCILE_INCONSISTENCY", {
                            "order_id": str(order.id),
                            "external_id": order.external_id,
                            "sku": item.sku,
                            "variant_id": str(item.variant_id),
                            "expected": item.quantity,
                            "actual_net_reserved": net_reserved,
                            "delta": delta,
                        })

                        if settings.RECONCILE_REPAIR:
                            # Repair with FOR UPDATE lock
                            inv_result = await session.execute(
                                select(Inventory)
                                .where(Inventory.variant_id == item.variant_id)
                                .with_for_update()
                            )
                            inventory: Inventory | None = inv_result.scalar_one_or_none()
                            if inventory:
                                if delta > 0:
                                    can = min(delta, inventory.stock_available)
                                    inventory.stock_reserved += can
                                    movement_type = "reserve"
                                    applied_delta = can
                                else:
                                    release = min(abs(delta), inventory.stock_reserved)
                                    inventory.stock_reserved = max(0, inventory.stock_reserved - release)
                                    movement_type = "release"
                                    applied_delta = -release

                                session.add(InventoryMovement(
                                    variant_id=item.variant_id,
                                    order_id=order.id,
                                    movement_type=movement_type,
                                    quantity=abs(applied_delta),
                                    reason="reconcile_repair",
                                ))
                                await create_event(session, "RECONCILE_REPAIRED", {
                                    "order_id": str(order.id),
                                    "sku": item.sku,
                                    "delta_applied": applied_delta,
                                })
                                repairs_applied += 1

            await session.commit()

    finally:
        await engine.dispose()

    return {
        "orders_checked": len(orders) if 'orders' in dir() else 0,
        "inconsistencies_found": inconsistencies_found,
        "repairs_applied": repairs_applied,
        "repair_mode": settings.RECONCILE_REPAIR,
    }
