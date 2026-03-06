"""
app/routers/raw_materials.py
CRUD + autocomplete + duplicate endpoints for RawMaterial (Matéria-Prima).
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.raw_material import (
    AutocompleteResponse,
    RawMaterialCreate,
    RawMaterialRead,
    RawMaterialUpdate,
)
from app.services import raw_material_service

router = APIRouter(tags=["Raw Materials"])


# ── Autocomplete (must be before /{id} routes) ────────────────────────────


@router.get(
    "/raw-materials/autocomplete",
    response_model=AutocompleteResponse,
    summary="Autocomplete de campos de matéria-prima",
)
async def autocomplete(
    field: str = Query(..., description="Nome do campo (color, composition, unit, subcategory, category)"),
    prefix: str = Query(default="", description="Prefixo para filtrar valores"),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> AutocompleteResponse:
    values = await raw_material_service.autocomplete(db, field, prefix, limit)
    return AutocompleteResponse(field=field, values=values)


# ── CRUD ──────────────────────────────────────────────────────────────────


@router.post(
    "/raw-materials",
    response_model=RawMaterialRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar matéria-prima",
)
async def create_raw_material(
    data: RawMaterialCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RawMaterialRead:
    return await raw_material_service.create_raw_material(db, data)  # type: ignore[return-value]


@router.get(
    "/raw-materials",
    response_model=PaginatedResponse[RawMaterialRead],
    summary="Listar matérias-primas (filtros: category, supplier_id, search)",
)
async def list_raw_materials(
    category: str | None = Query(default=None),
    supplier_id: uuid.UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[RawMaterialRead]:
    total, items = await raw_material_service.list_raw_materials(
        db, category, supplier_id, search, page, page_size
    )
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=list(items))


@router.get(
    "/raw-materials/{raw_material_id}",
    response_model=RawMaterialRead,
    summary="Buscar matéria-prima por ID",
)
async def get_raw_material(
    raw_material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RawMaterialRead:
    return await raw_material_service.get_raw_material_or_404(db, raw_material_id)  # type: ignore[return-value]


@router.put(
    "/raw-materials/{raw_material_id}",
    response_model=RawMaterialRead,
    summary="Atualizar matéria-prima",
)
async def update_raw_material(
    raw_material_id: uuid.UUID,
    data: RawMaterialUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RawMaterialRead:
    return await raw_material_service.update_raw_material(db, raw_material_id, data)  # type: ignore[return-value]


@router.delete(
    "/raw-materials/{raw_material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir matéria-prima permanentemente",
)
async def delete_raw_material(
    raw_material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await raw_material_service.delete_raw_material(db, raw_material_id)


@router.patch(
    "/raw-materials/{raw_material_id}/toggle-active",
    response_model=RawMaterialRead,
    summary="Alternar status ativo/inativo da matéria-prima",
)
async def toggle_raw_material_active(
    raw_material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RawMaterialRead:
    return await raw_material_service.toggle_raw_material_active(db, raw_material_id)  # type: ignore[return-value]


# ── Duplicate ─────────────────────────────────────────────────────────────


@router.post(
    "/raw-materials/{raw_material_id}/duplicate",
    response_model=RawMaterialRead,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicar matéria-prima",
)
async def duplicate_raw_material(
    raw_material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RawMaterialRead:
    return await raw_material_service.duplicate_raw_material(db, raw_material_id)  # type: ignore[return-value]
