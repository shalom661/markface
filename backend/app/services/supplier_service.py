"""
app/services/supplier_service.py
CRUD business logic for Suppliers.
Fires domain events automatically.
"""

import uuid
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.services.event_service import create_event


async def create_supplier(db: AsyncSession, data: SupplierCreate) -> Supplier:
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    await db.flush()
    await create_event(
        db,
        "SUPPLIER_CREATED",
        {"supplier_id": str(supplier.id), "name": supplier.name},
    )
    return supplier


async def list_suppliers(
    db: AsyncSession,
    search: str | None = None,
    active_only: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, Sequence[Supplier]]:
    query = select(Supplier)
    if active_only:
        query = query.where(Supplier.active == True)  # noqa: E712
    if search:
        query = query.where(Supplier.name.ilike(f"%{search}%"))
    query = query.order_by(Supplier.name)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    items = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return total, items


async def get_supplier_or_404(db: AsyncSession, supplier_id: uuid.UUID) -> Supplier:
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fornecedor não encontrado.",
        )
    return supplier


async def update_supplier(
    db: AsyncSession, supplier_id: uuid.UUID, data: SupplierUpdate
) -> Supplier:
    supplier = await get_supplier_or_404(db, supplier_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(supplier, field, value)
    await db.flush()
    await create_event(
        db,
        "SUPPLIER_UPDATED",
        {"supplier_id": str(supplier.id), "changes": data.model_dump(exclude_none=True)},
    )
    return supplier


async def delete_supplier(db: AsyncSession, supplier_id: uuid.UUID) -> None:
    """Hard delete: remove permanently."""
    supplier = await get_supplier_or_404(db, supplier_id)
    await db.delete(supplier)
    await db.flush()
    await create_event(
        db,
        "SUPPLIER_DELETED",
        {"supplier_id": str(supplier_id), "name": supplier.name},
    )


async def toggle_supplier_active(db: AsyncSession, supplier_id: uuid.UUID) -> Supplier:
    """Toggle the active status of a supplier."""
    supplier = await get_supplier_or_404(db, supplier_id)
    supplier.active = not supplier.active
    await db.flush()
    await create_event(
        db,
        "SUPPLIER_STATUS_TOGGLED",
        {"supplier_id": str(supplier.id), "active": supplier.active},
    )
    return supplier
