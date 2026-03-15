"""
app/routers/product_categories.py
API endpoints for Product Categories.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, get_optional_user
from app.models.user import User
from app.schemas.product_category import ProductCategoryCreate, ProductCategoryRead, ProductCategoryUpdate
from app.services import product_category_service

router = APIRouter(tags=["Product Categories"])

@router.get(
    "/product-categories",
    response_model=List[ProductCategoryRead],
    summary="Listar categorias de produtos",
)
async def list_categories(
    active_only: bool = Query(default=False),
    root_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
) -> List[ProductCategoryRead]:
    # Non-admin users see only active categories
    if _user is None:
        active_only = True
        
    categories = await product_category_service.list_categories(db, active_only, root_only)
    return [ProductCategoryRead.model_validate(c) for c in categories]

@router.post(
    "/product-categories",
    response_model=ProductCategoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar categoria de produto",
)
async def create_category(
    data: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> ProductCategoryRead:
    category = await product_category_service.create_category(db, data)
    return ProductCategoryRead.model_validate(category)

@router.get(
    "/product-categories/{category_id}",
    response_model=ProductCategoryRead,
    summary="Buscar categoria por ID",
)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProductCategoryRead:
    category = await product_category_service.get_category_or_404(db, category_id)
    return ProductCategoryRead.model_validate(category)

@router.put(
    "/product-categories/{category_id}",
    response_model=ProductCategoryRead,
    summary="Atualizar categoria",
)
async def update_category(
    category_id: uuid.UUID,
    data: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> ProductCategoryRead:
    category = await product_category_service.update_category(db, category_id, data)
    return ProductCategoryRead.model_validate(category)

@router.delete(
    "/product-categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir categoria",
)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await product_category_service.delete_category(db, category_id)
