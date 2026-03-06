"""
app/routers/inventory.py
Inventory endpoints: list, get by variant, adjust stock.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.inventory import InventoryRead, StockAdjustRequest
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get(
    "",
    response_model=PaginatedResponse[InventoryRead],
    summary="Listar inventário (paginado)",
)
async def list_inventory(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[InventoryRead]:
    total, items = await inventory_service.list_inventory(db, page, page_size)
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.get(
    "/{variant_id}",
    response_model=InventoryRead,
    summary="Buscar inventário por variante",
)
async def get_inventory(
    variant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> InventoryRead:
    return await inventory_service.get_inventory_by_variant(db, variant_id)  # type: ignore[return-value]


@router.post(
    "/{variant_id}/adjust",
    response_model=InventoryRead,
    summary="Ajustar estoque (gera evento STOCK_ADJUSTED)",
)
async def adjust_stock(
    variant_id: uuid.UUID,
    data: StockAdjustRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> InventoryRead:
    return await inventory_service.adjust_stock(db, variant_id, data)  # type: ignore[return-value]
