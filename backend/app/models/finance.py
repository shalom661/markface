"""
app/models/finance.py
Models for Fixed Costs and Financial settings.
"""

from decimal import Decimal
from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, UUIDMixin

class FixedCost(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "fixed_costs"

    description: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    
    def __repr__(self) -> str:
        return f"<FixedCost description={self.description!r} value={self.value}>"
