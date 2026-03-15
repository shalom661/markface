"""
app/services/site_config_service.py
Business logic for website configuration (banners, featured sections).
"""

import uuid
from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.site_config import SiteBanner, SiteFeaturedSection
from app.schemas.site_config import SiteBannerCreate, SiteBannerUpdate, SiteFeaturedSectionCreate, SiteFeaturedSectionUpdate

# ── Site Banners ────────────────────────────────────────────────────────────

async def list_banners(db: AsyncSession, active_only: bool = False) -> Sequence[SiteBanner]:
    query = select(SiteBanner).order_by(SiteBanner.order, SiteBanner.created_at.desc())
    if active_only:
        query = query.where(SiteBanner.active == True)
    result = await db.execute(query)
    return result.scalars().all()

async def create_banner(db: AsyncSession, data: SiteBannerCreate) -> SiteBanner:
    banner = SiteBanner(**data.model_dump())
    db.add(banner)
    await db.flush()
    return banner

async def update_banner(db: AsyncSession, banner_id: uuid.UUID, data: SiteBannerUpdate) -> SiteBanner:
    result = await db.execute(select(SiteBanner).where(SiteBanner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner não encontrado.")
    
    data_dict = data.model_dump(exclude_unset=True)
    for field, value in data_dict.items():
        setattr(banner, field, value)
    
    await db.flush()
    return banner

async def delete_banner(db: AsyncSession, banner_id: uuid.UUID) -> None:
    result = await db.execute(select(SiteBanner).where(SiteBanner.id == banner_id))
    banner = result.scalar_one_or_none()
    if banner:
        await db.delete(banner)
        await db.flush()

# ── Site Featured Sections ──────────────────────────────────────────────────

async def list_featured_sections(db: AsyncSession, active_only: bool = False) -> Sequence[SiteFeaturedSection]:
    query = select(SiteFeaturedSection).order_by(SiteFeaturedSection.order, SiteFeaturedSection.created_at.desc())
    if active_only:
        query = query.where(SiteFeaturedSection.active == True)
    result = await db.execute(query)
    return result.scalars().all()

async def create_featured_section(db: AsyncSession, data: SiteFeaturedSectionCreate) -> SiteFeaturedSection:
    section = SiteFeaturedSection(**data.model_dump())
    db.add(section)
    await db.flush()
    return section

async def update_featured_section(db: AsyncSession, section_id: uuid.UUID, data: SiteFeaturedSectionUpdate) -> SiteFeaturedSection:
    result = await db.execute(select(SiteFeaturedSection).where(SiteFeaturedSection.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seção de destaque não encontrada.")
    
    data_dict = data.model_dump(exclude_unset=True)
    for field, value in data_dict.items():
        setattr(section, field, value)
    
    await db.flush()
    return section

async def delete_featured_section(db: AsyncSession, section_id: uuid.UUID) -> None:
    result = await db.execute(select(SiteFeaturedSection).where(SiteFeaturedSection.id == section_id))
    section = result.scalar_one_or_none()
    if section:
        await db.delete(section)
        await db.flush()
