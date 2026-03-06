"""
app/routers/suppliers.py
CRUD endpoints for Suppliers (Fornecedores).
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate
from app.services import supplier_service

router = APIRouter(tags=["Suppliers"])


@router.post(
    "/suppliers",
    response_model=SupplierRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar fornecedor",
)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SupplierRead:
    return await supplier_service.create_supplier(db, data)  # type: ignore[return-value]


@router.get(
    "/suppliers",
    response_model=PaginatedResponse[SupplierRead],
    summary="Listar fornecedores (paginado)",
)
async def list_suppliers(
    search: str | None = Query(default=None),
    active_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[SupplierRead]:
    total, items = await supplier_service.list_suppliers(
        db, search, active_only, page, page_size
    )
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.get(
    "/suppliers/{supplier_id}",
    response_model=SupplierRead,
    summary="Buscar fornecedor por ID",
)
async def get_supplier(
    supplier_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SupplierRead:
    return await supplier_service.get_supplier_or_404(db, supplier_id)  # type: ignore[return-value]


@router.put(
    "/suppliers/{supplier_id}",
    response_model=SupplierRead,
    summary="Atualizar fornecedor",
)
async def update_supplier(
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SupplierRead:
    return await supplier_service.update_supplier(db, supplier_id, data)  # type: ignore[return-value]


@router.delete(
    "/suppliers/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir fornecedor permanentemente",
)
async def delete_supplier(
    supplier_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await supplier_service.delete_supplier(db, supplier_id)


@router.patch(
    "/suppliers/{supplier_id}/toggle-active",
    response_model=SupplierRead,
    summary="Alternar status ativo/inativo do fornecedor",
)
async def toggle_supplier_active(
    supplier_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SupplierRead:
    return await supplier_service.toggle_supplier_active(db, supplier_id)  # type: ignore[return-value]
