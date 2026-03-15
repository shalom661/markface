"""
app/services/product_category_service.py
Business logic for hierarchical Product Categories.
"""

import uuid
from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product_category import ProductCategory
from app.schemas.product_category import ProductCategoryCreate, ProductCategoryUpdate

async def list_categories(db: AsyncSession, active_only: bool = False, root_only: bool = False) -> Sequence[ProductCategory]:
    """Lista as categorias, opcionalmente filtrando apenas raízes para carregamento hierárquico."""
    query = select(ProductCategory).options(selectinload(ProductCategory.children))
    
    if active_only:
        query = query.where(ProductCategory.active == True)
    
    if root_only:
        query = query.where(ProductCategory.parent_id == None)
        
    query = query.order_by(ProductCategory.order, ProductCategory.name)
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_category_or_404(db: AsyncSession, category_id: uuid.UUID) -> ProductCategory:
    result = await db.execute(
        select(ProductCategory)
        .options(selectinload(ProductCategory.children))
        .where(ProductCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada."
        )
    return category

async def create_category(db: AsyncSession, data: ProductCategoryCreate) -> ProductCategory:
    # Check if slug exists
    slug_exists = (
        await db.execute(select(ProductCategory).where(ProductCategory.slug == data.slug))
    ).scalar_one_or_none()
    
    if slug_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Slug '{data.slug}' já está em uso."
        )
        
    category = ProductCategory(**data.model_dump())
    db.add(category)
    await db.flush()
    return category

async def update_category(db: AsyncSession, category_id: uuid.UUID, data: ProductCategoryUpdate) -> ProductCategory:
    category = await get_category_or_404(db, category_id)
    data_dict = data.model_dump(exclude_unset=True)
    
    # Check slug uniqueness if changing
    if "slug" in data_dict and data_dict["slug"] != category.slug:
        slug_exists = (
            await db.execute(
                select(ProductCategory)
                .where(ProductCategory.slug == data_dict["slug"])
                .where(ProductCategory.id != category_id)
            )
        ).scalar_one_or_none()
        
        if slug_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slug '{data_dict['slug']}' já está em uso."
            )
            
    for field, value in data_dict.items():
        setattr(category, field, value)
        
    await db.flush()
    return category

async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> None:
    category = await get_category_or_404(db, category_id)
    await db.delete(category)
    await db.flush()
