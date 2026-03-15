"""
app/routers/site_config.py
API endpoints for Website Configuration (Banners, Featured Sections).
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, get_optional_user
from app.models.user import User
from app.schemas.site_config import (
    SiteBannerCreate, SiteBannerRead, SiteBannerUpdate,
    SiteFeaturedSectionCreate, SiteFeaturedSectionRead, SiteFeaturedSectionUpdate
)
from app.services import site_config_service

router = APIRouter(tags=["Site Configuration"])

# ── Banners ─────────────────────────────────────────────────────────────────

@router.get(
    "/site/banners",
    response_model=List[SiteBannerRead],
    summary="Listar banners do site",
)
async def list_banners(
    active_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
) -> List[SiteBannerRead]:
    if _user is None:
        active_only = True
    banners = await site_config_service.list_banners(db, active_only)
    return [SiteBannerRead.model_validate(b) for b in banners]

@router.post(
    "/site/banners",
    response_model=SiteBannerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar banner",
)
async def create_banner(
    data: SiteBannerCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SiteBannerRead:
    banner = await site_config_service.create_banner(db, data)
    return SiteBannerRead.model_validate(banner)

@router.put(
    "/site/banners/{banner_id}",
    response_model=SiteBannerRead,
    summary="Atualizar banner",
)
async def update_banner(
    banner_id: uuid.UUID,
    data: SiteBannerUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SiteBannerRead:
    banner = await site_config_service.update_banner(db, banner_id, data)
    return SiteBannerRead.model_validate(banner)

@router.delete(
    "/site/banners/{banner_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir banner",
)
async def delete_banner(
    banner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await site_config_service.delete_banner(db, banner_id)

# ── Featured Sections ───────────────────────────────────────────────────────

@router.get(
    "/site/featured-sections",
    response_model=List[SiteFeaturedSectionRead],
    summary="Listar seções de destaque do site",
)
async def list_featured_sections(
    active_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
) -> List[SiteFeaturedSectionRead]:
    if _user is None:
        active_only = True
    sections = await site_config_service.list_featured_sections(db, active_only)
    return [SiteFeaturedSectionRead.model_validate(s) for s in sections]

@router.post(
    "/site/featured-sections",
    response_model=SiteFeaturedSectionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar seção de destaque",
)
async def create_featured_section(
    data: SiteFeaturedSectionCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SiteFeaturedSectionRead:
    section = await site_config_service.create_featured_section(db, data)
    return SiteFeaturedSectionRead.model_validate(section)

@router.put(
    "/site/featured-sections/{section_id}",
    response_model=SiteFeaturedSectionRead,
    summary="Atualizar seção de destaque",
)
async def update_featured_section(
    section_id: uuid.UUID,
    data: SiteFeaturedSectionUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> SiteFeaturedSectionRead:
    section = await site_config_service.update_featured_section(db, section_id, data)
    return SiteFeaturedSectionRead.model_validate(section)

@router.delete(
    "/site/featured-sections/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir seção de destaque",
)
async def delete_featured_section(
    section_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    await site_config_service.delete_featured_section(db, section_id)
