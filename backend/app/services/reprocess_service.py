"""
app/services/reprocess_service.py
Internal reprocess logic for repairing inventory reservations.

For a given Order, computes the expected reservation (from OrderItems) vs.
actual net movements (reserve - release) per variant, then applies delta corrections
using FOR UPDATE row locks, and emits ORDER_REPROCESSED event.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.inventory import Inventory
from app.models.order import InventoryMovement, Order, OrderItem
from app.services.event_service import create_event

log = get_logger(__name__)


async def reprocess_order(db: AsyncSession, order_id: uuid.UUID) -> dict:
    """
    Load order, compute expected vs. actual stock reservation per SKU,
    apply corrective deltas with FOR UPDATE locks, and emit ORDER_REPROCESSED event.

    Returns a summary of deltas applied per SKU.
    """
    # Load order with FOR UPDATE
    result = await db.execute(
        select(Order).where(Order.id == order_id).with_for_update()
    )
    order: Order | None = result.scalar_one_or_none()
    if order is None:
        return {"error": f"Order {order_id} not found"}

    # Load items
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    deltas_applied: list[dict] = []

    for item in items:
        if item.variant_id is None:
            continue  # Unmapped SKU — skip

        # Compute net reserved movements for this order + variant
        movements_result = await db.execute(
            select(InventoryMovement).where(
                InventoryMovement.order_id == order.id,
                InventoryMovement.variant_id == item.variant_id,
            )
        )
        movements = movements_result.scalars().all()

        net_reserved = sum(
            m.quantity if m.movement_type == "reserve" else -m.quantity
            for m in movements
        )
        expected = item.quantity
        delta = expected - net_reserved

        if delta == 0:
            continue

        # Lock inventory row
        inv_result = await db.execute(
            select(Inventory)
            .where(Inventory.variant_id == item.variant_id)
            .with_for_update()
        )
        inventory: Inventory | None = inv_result.scalar_one_or_none()
        if inventory is None:
            continue

        reserved_before = inventory.stock_reserved

        if delta > 0:
            # Need to reserve more
            can_reserve = min(delta, inventory.stock_available)
            if can_reserve <= 0:
                log.warning(
                    "reprocess_cannot_reserve",
                    sku=item.sku,
                    delta=delta,
                    available=inventory.stock_available,
                )
                deltas_applied.append({
                    "sku": item.sku,
                    "variant_id": str(item.variant_id),
                    "delta_attempted": delta,
                    "delta_applied": 0,
                    "reason": "insufficient_stock",
                })
                continue
            inventory.stock_reserved += can_reserve
            movement_type = "reserve"
            actual_delta = can_reserve
        else:
            # Need to release excess
            release = min(abs(delta), inventory.stock_reserved)
            inventory.stock_reserved = max(0, inventory.stock_reserved - release)
            movement_type = "release"
            actual_delta = -release

        await db.flush()

        db.add(InventoryMovement(
            variant_id=item.variant_id,
            order_id=order.id,
            movement_type=movement_type,
            quantity=abs(actual_delta),
            reason="manual_reprocess",
        ))
        await db.flush()

        log.info(
            "reprocess_delta_applied",
            sku=item.sku,
            delta=actual_delta,
            reserved_before=reserved_before,
            reserved_after=inventory.stock_reserved,
        )

        deltas_applied.append({
            "sku": item.sku,
            "variant_id": str(item.variant_id),
            "net_reserved_before": net_reserved,
            "expected": expected,
            "delta_applied": actual_delta,
            "stock_reserved_after": inventory.stock_reserved,
        })

    event = await create_event(db, "ORDER_REPROCESSED", {
        "order_id": str(order.id),
        "external_id": order.external_id,
        "channel": order.channel,
        "deltas": deltas_applied,
    })
    await db.flush()

    return {
        "order_id": str(order.id),
        "external_id": order.external_id,
        "deltas": deltas_applied,
        "event_id": str(event.id) if event else None,
    }
