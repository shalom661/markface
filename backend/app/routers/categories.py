from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.category import CategoryRead, CategoryCreate, CategoryUpdate
from app.services import category_service

router = APIRouter(tags=["Categories"])

@router.get("/categories", response_model=List[CategoryRead])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Lista todas as categorias de matéria-prima ativas."""
    # Seed if empty for first run
    await category_service.seed_categories(db)
    await db.commit() # Commit seed if happened
    return await category_service.list_categories(db)

@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate, 
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Cria uma nova categoria."""
    category = await category_service.create_category(db, data)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID, 
    data: CategoryUpdate, 
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Atualiza uma categoria existente."""
    category = await category_service.update_category(db, category_id, data)
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Exclui uma categoria permanentemente."""
    await category_service.delete_category(db, category_id)
    await db.commit()

@router.patch("/categories/{category_id}/toggle-active", response_model=CategoryRead)
async def toggle_category_active(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    """Alternar status ativo/inativo da categoria."""
    category = await category_service.toggle_category_active(db, category_id)
    await db.commit()
    await db.refresh(category)
    return category
