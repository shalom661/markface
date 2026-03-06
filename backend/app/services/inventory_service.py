"""
app/services/inventory_service.py
Stock management with validation: no negative stock allowed.
Fires STOCK_ADJUSTED events on any manual change.
"""

import uuid
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory
from app.schemas.inventory import StockAdjustRequest
from app.services.event_service import create_event


async def list_inventory(
    db: AsyncSession, page: int = 1, page_size: int = 20
) -> tuple[int, Sequence[Inventory]]:
    query = select(Inventory).order_by(Inventory.updated_at.desc())
    from sqlalchemy import func
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()
    items = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return total, items


async def get_inventory_by_variant(db: AsyncSession, variant_id: uuid.UUID) -> Inventory:
    result = await db.execute(
        select(Inventory).where(Inventory.variant_id == variant_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventário para variante {variant_id} não encontrado.",
        )
    return inv


async def adjust_stock(
    db: AsyncSession, variant_id: uuid.UUID, data: StockAdjustRequest
) -> Inventory:
    """
    Apply a stock adjustment.
    - If `delta` is provided, apply relative change.
    - If `set_absolute` is provided, set stock to that value.
    Raises 422 if the result would be negative.
    Raises 400 if neither or both fields are provided.
    """
    if data.delta is None and data.set_absolute is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça 'delta' ou 'set_absolute'.",
        )
    if data.delta is not None and data.set_absolute is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça apenas 'delta' OU 'set_absolute', não ambos.",
        )

    inv = await get_inventory_by_variant(db, variant_id)
    old_stock = inv.stock_available

    if data.delta is not None:
        new_stock = old_stock + data.delta
    else:
        new_stock = data.set_absolute  # type: ignore[assignment]

    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Estoque não pode ficar negativo. Atual: {old_stock}, delta: {data.delta}.",
        )

    inv.stock_available = new_stock
    await db.flush()

    await create_event(
        db,
        "STOCK_ADJUSTED",
        {
            "variant_id": str(variant_id),
            "old_stock": old_stock,
            "new_stock": new_stock,
            "delta": data.delta,
            "set_absolute": data.set_absolute,
            "reason": data.reason,
        },
    )
    return inv
