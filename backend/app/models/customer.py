"""
app/models/customer.py
Customer model for Section 3.
"""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class Customer(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "customers"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)  # CPF/CNPJ
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<Customer id={self.id} name={self.name!r}>"
