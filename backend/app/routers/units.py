from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.unit import UnitRead, UnitCreate, UnitUpdate
from app.services import unit_service

router = APIRouter(tags=["Units"])

@router.get("/units", response_model=List[UnitRead])
async def list_units(
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Lista todas as unidades de medida."""
    await unit_service.seed_units(db)
    await db.commit()
    return await unit_service.list_units(db, active_only)

@router.post("/units", response_model=UnitRead, status_code=status.HTTP_201_CREATED)
async def create_unit(
    data: UnitCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Cria uma nova unidade de medida."""
    unit = await unit_service.create_unit(db, data)
    await db.commit()
    await db.refresh(unit)
    return unit

@router.put("/units/{unit_id}", response_model=UnitRead)
async def update_unit(
    unit_id: str,
    data: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Atualiza uma unidade existente."""
    unit = await unit_service.update_unit(db, unit_id, data)
    await db.commit()
    await db.refresh(unit)
    return unit

@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Exclui uma unidade permanentemente."""
    await unit_service.delete_unit(db, unit_id)
    await db.commit()

@router.patch("/units/{unit_id}/toggle-active", response_model=UnitRead)
async def toggle_unit_active(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Alternar status ativo/inativo da unidade."""
    unit = await unit_service.toggle_unit_active(db, unit_id)
    await db.commit()
    await db.refresh(unit)
    return unit
