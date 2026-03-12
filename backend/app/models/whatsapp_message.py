"""
app/models/whatsapp_message.py
Model for storing WhatsApp message history.
"""

from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin, TimestampMixin

class WhatsAppMessage(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "whatsapp_messages"

    # Meta's unique message ID (e.g., wamid.HBgNNTUxMTk5MDExNTMw...)
    wa_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    # Phone number of the sender
    from_phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    
    # Phone number of the recipient
    to_phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    
    # Content of the message
    body: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Message type (text, image, audio, etc.)
    msg_type: Mapped[str] = mapped_column(String(20), default="text", nullable=False)
    
    # Direction: inbound (customer -> hub) or outbound (hub -> customer)
    direction: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    
    # Delivery status: sent, delivered, read, failed
    status: Mapped[str] = mapped_column(String(20), default="sent", index=True, nullable=False)
    
    # Meta's timestamp of the message
    wa_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<WhatsAppMessage wa_id={self.wa_id} direction={self.direction} status={self.status}>"
