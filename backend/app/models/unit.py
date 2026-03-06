from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin, TimestampMixin

class MeasurementUnit(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "measurement_units"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<MeasurementUnit symbol={self.symbol!r}>"
