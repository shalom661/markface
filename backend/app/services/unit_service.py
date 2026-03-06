import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import Sequence

from app.models.unit import MeasurementUnit
from app.schemas.unit import UnitCreate, UnitUpdate

async def list_units(db: AsyncSession, active_only: bool = False) -> Sequence[MeasurementUnit]:
    query = select(MeasurementUnit)
    if active_only:
        query = query.where(MeasurementUnit.active == True)
    query = query.order_by(MeasurementUnit.name)
    result = await db.execute(query)
    return result.scalars().all()

async def create_unit(db: AsyncSession, data: UnitCreate) -> MeasurementUnit:
    # Check if name or symbol already exists
    existing = await db.execute(
        select(MeasurementUnit).where(
            (MeasurementUnit.name == data.name) | (MeasurementUnit.symbol == data.symbol)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unidade com este nome ou símbolo já existe."
        )
    
    unit = MeasurementUnit(**data.model_dump())
    db.add(unit)
    await db.flush()
    return unit

async def get_unit_or_404(db: AsyncSession, unit_id: str) -> MeasurementUnit:
    result = await db.execute(select(MeasurementUnit).where(MeasurementUnit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade não encontrada.")
    return unit

async def update_unit(db: AsyncSession, unit_id: str, data: UnitUpdate) -> MeasurementUnit:
    unit = await get_unit_or_404(db, unit_id)
    
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(unit, field, value)
    
    await db.flush()
    return unit

async def delete_unit(db: AsyncSession, unit_id: str) -> None:
    unit = await get_unit_or_404(db, unit_id)
    await db.delete(unit)
    await db.flush()

async def toggle_unit_active(db: AsyncSession, unit_id: str) -> MeasurementUnit:
    unit = await get_unit_or_404(db, unit_id)
    unit.active = not unit.active
    await db.flush()
    return unit

async def seed_units(db: AsyncSession):
    """Seed initial common units if the table is empty."""
    query = select(MeasurementUnit)
    result = await db.execute(query)
    if result.scalars().first():
        return

    common_units = [
        {"name": "Quilograma", "symbol": "kg"},
        {"name": "Grama", "symbol": "g"},
        {"name": "Metro", "symbol": "m"},
        {"name": "Centímetro", "symbol": "cm"},
        {"name": "Milímetro", "symbol": "mm"},
        {"name": "Unidade", "symbol": "un"},
        {"name": "Par", "symbol": "par"},
        {"name": "Rolo", "symbol": "rolo"},
        {"name": "Litro", "symbol": "L"},
    ]
    
    for u in common_units:
        db.add(MeasurementUnit(**u))
    await db.flush()
