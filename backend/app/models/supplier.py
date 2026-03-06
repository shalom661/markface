"""
app/models/supplier.py
Supplier model — fornecedores de matéria-prima.
"""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Supplier(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "suppliers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship — lazy="select" avoids loading all raw materials eagerly
    raw_materials: Mapped[list["RawMaterial"]] = relationship(  # type: ignore[name-defined]
        "RawMaterial", back_populates="supplier", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Supplier id={self.id} name={self.name!r}>"
