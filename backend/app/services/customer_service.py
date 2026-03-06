"""
app/services/customer_service.py
CRUD business logic for Customers.
"""

import uuid
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.services.event_service import create_event


async def create_customer(db: AsyncSession, data: CustomerCreate) -> Customer:
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.flush()
    await create_event(
        db,
        "CUSTOMER_CREATED",
        {"customer_id": str(customer.id), "name": customer.name},
    )
    return customer


async def list_customers(
    db: AsyncSession,
    search: str | None = None,
    active_only: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, Sequence[Customer]]:
    query = select(Customer)
    if active_only:
        query = query.where(Customer.active == True)  # noqa: E712
    if search:
        query = query.where(
            (Customer.name.ilike(f"%{search}%")) | 
            (Customer.email.ilike(f"%{search}%")) |
            (Customer.tax_id.ilike(f"%{search}%"))
        )
    query = query.order_by(Customer.name)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    items = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return total, items


async def get_customer_or_404(db: AsyncSession, customer_id: uuid.UUID) -> Customer:
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )
    return customer


async def update_customer(
    db: AsyncSession, customer_id: uuid.UUID, data: CustomerUpdate
) -> Customer:
    customer = await get_customer_or_404(db, customer_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(customer, field, value)
    await db.flush()
    await create_event(
        db,
        "CUSTOMER_UPDATED",
        {"customer_id": str(customer.id), "changes": data.model_dump(exclude_none=True)},
    )
    return customer


async def delete_customer(db: AsyncSession, customer_id: uuid.UUID) -> None:
    """Hard delete: remove permanently."""
    customer = await get_customer_or_404(db, customer_id)
    await db.delete(customer)
    await db.flush()
    await create_event(
        db,
        "CUSTOMER_DELETED",
        {"customer_id": str(customer_id), "name": customer.name},
    )


async def toggle_customer_active(db: AsyncSession, customer_id: uuid.UUID) -> Customer:
    """Toggle the active status of a customer."""
    customer = await get_customer_or_404(db, customer_id)
    customer.active = not customer.active
    await db.flush()
    await create_event(
        db,
        "CUSTOMER_STATUS_TOGGLED",
        {"customer_id": str(customer.id), "active": customer.active},
    )
    return customer
