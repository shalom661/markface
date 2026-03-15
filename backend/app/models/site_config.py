"""
app/models/site_config.py
Models for website customization (banners, featured sections).
"""

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

from app.db.base import Base, UUIDMixin, TimestampMixin
from app.db.types import JSONBType

class SiteBanner(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "site_banners"

    image_url: Mapped[str] = mapped_column(sa.String(500), nullable=False)
    link_url: Mapped[Optional[str]] = mapped_column(sa.String(500), nullable=True)
    duration: Mapped[int] = mapped_column(sa.Integer, default=5, nullable=False) # seconds
    active: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)
    order: Mapped[int] = mapped_column(sa.Integer, default=0, nullable=False)

    def __repr__(self) -> str:
        return f"<SiteBanner id={self.id} active={self.active}>"

class SiteFeaturedSection(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "site_featured_sections"

    title: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    active: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)
    order: Mapped[int] = mapped_column(sa.Integer, default=0, nullable=False)
    layout: Mapped[str] = mapped_column(sa.String(50), default="TABS", nullable=False) # e.g. "TABS", "GRID", "CAROUSEL"
    
    # Configuration for items in section
    # { "tabs": [ { "title": "...", "category_id": "...", "product_ids": [...] }, ... ] }
    config: Mapped[dict | None] = mapped_column(JSONBType, nullable=True, default=dict)

    def __repr__(self) -> str:
        return f"<SiteFeaturedSection title={self.title!r} active={self.active}>"
