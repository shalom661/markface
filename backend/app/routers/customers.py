"""
app/routers/customers.py
CRUD endpoints for Customers (Clientes).
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.services import customer_service

router = APIRouter(tags=["Customers"])


@router.post(
    "/customers",
    response_model=CustomerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar cliente",
)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CustomerRead:
    return await customer_service.create_customer(db, data)  # type: ignore[return-value]


@router.get(
    "/customers",
    response_model=PaginatedResponse[CustomerRead],
    summary="Listar clientes (paginado)",
)
async def list_customers(
    search: str | None = Query(default=None),
    active_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[CustomerRead]:
    total, items = await customer_service.list_customers(
        db, search, active_only, page, page_size
    )
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerRead,
    summary="Buscar cliente por ID",
)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CustomerRead:
    return await customer_service.get_customer_or_404(db, customer_id)  # type: ignore[return-value]


@router.put(
    "/customers/{customer_id}",
    response_model=CustomerRead,
    summary="Atualizar cliente",
)
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CustomerRead:
    return await customer_service.update_customer(db, customer_id, data)  # type: ignore[return-value]


@router.delete(
    "/customers/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir cliente permanentemente",
)
async def delete_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await customer_service.delete_customer(db, customer_id)


@router.patch(
    "/customers/{customer_id}/toggle-active",
    response_model=CustomerRead,
    summary="Alternar status ativo/inativo do cliente",
)
async def toggle_customer_active(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CustomerRead:
    return await customer_service.toggle_customer_active(db, customer_id)  # type: ignore[return-value]
