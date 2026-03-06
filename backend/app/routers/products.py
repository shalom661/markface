"""
app/routers/products.py
CRUD endpoints for Products and ProductVariants.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate, VariantCreate, VariantRead, VariantUpdate
from app.services import product_service

router = APIRouter(tags=["Products & Variants"])


# ── Products ───────────────────────────────────────────────────────────────


@router.post(
    "/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar produto",
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> ProductRead:
    return await product_service.create_product(db, data)  # type: ignore[return-value]


@router.get(
    "/products",
    response_model=PaginatedResponse[ProductRead],
    summary="Listar produtos (paginado)",
)
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    active_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[ProductRead]:
    total, items = await product_service.list_products(db, page, page_size, active_only)
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.get(
    "/products/{product_id}",
    response_model=ProductRead,
    summary="Buscar produto por ID",
)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> ProductRead:
    return await product_service.get_product_or_404(db, product_id)  # type: ignore[return-value]


@router.put(
    "/products/{product_id}",
    response_model=ProductRead,
    summary="Atualizar produto",
)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> ProductRead:
    return await product_service.update_product(db, product_id, data)  # type: ignore[return-value]


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir produto permanentemente",
)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await product_service.delete_product(db, product_id)


@router.patch(
    "/products/{product_id}/toggle-active",
    response_model=ProductRead,
    summary="Alternar status ativo/inativo do produto",
)
async def toggle_product_active(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> ProductRead:
    return await product_service.toggle_product_active(db, product_id)  # type: ignore[return-value]


# ── Variants ───────────────────────────────────────────────────────────────


@router.post(
    "/products/{product_id}/variants",
    response_model=VariantRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar variante de produto",
)
async def create_variant(
    product_id: uuid.UUID,
    data: VariantCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> VariantRead:
    return await product_service.create_variant(db, product_id, data)  # type: ignore[return-value]


@router.get(
    "/variants",
    response_model=PaginatedResponse[VariantRead],
    summary="Listar variantes (filtros: sku, active)",
)
async def list_variants(
    sku: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[VariantRead]:
    total, items = await product_service.list_variants(db, sku, active, page, page_size)
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.get(
    "/variants/{variant_id}",
    response_model=VariantRead,
    summary="Buscar variante por ID",
)
async def get_variant(
    variant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> VariantRead:
    return await product_service.get_variant_or_404(db, variant_id)  # type: ignore[return-value]


@router.put(
    "/variants/{variant_id}",
    response_model=VariantRead,
    summary="Atualizar variante",
)
async def update_variant(
    variant_id: uuid.UUID,
    data: VariantUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> VariantRead:
    return await product_service.update_variant(db, variant_id, data)  # type: ignore[return-value]


@router.delete(
    "/variants/{variant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir variante permanentemente",
)
async def delete_variant(
    variant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await product_service.delete_variant(db, variant_id)


@router.patch(
    "/variants/{variant_id}/toggle-active",
    response_model=VariantRead,
    summary="Alternar status ativo/inativo da variante",
)
async def toggle_variant_active(
    variant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> VariantRead:
    return await product_service.toggle_variant_active(db, variant_id)  # type: ignore[return-value]
