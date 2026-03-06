from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base, UUIDMixin, TimestampMixin
from app.db.types import JSONBType

class RawMaterialCategory(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "raw_material_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    fields: Mapped[list | None] = mapped_column(JSONBType, nullable=True, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<RawMaterialCategory name={self.name!r}>"
