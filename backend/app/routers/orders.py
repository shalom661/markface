from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.deps import get_db, get_current_user
from app.models.order import Order
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Orders"])

class OrderItemRead(BaseModel):
    sku: str
    name: str
    quantity: int

class OrderRead(BaseModel):
    id: str
    origin: str
    external_id: str
    external_status: str
    internal_status: str
    created_at: datetime
    items: List[OrderItemRead]

    class Config:
        from_attributes = True

@router.get("/orders")
async def list_orders(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user)
):
    # Very basic list for the UI
    result = await db.execute(select(Order).order_by(Order.created_at.desc()).limit(limit))
    orders = result.scalars().all()
    
    # Map to what frontend expects
    return {
        "total": len(orders),
        "items": [
            {
                "id": str(o.id),
                "origin": o.channel,
                "external_id": o.external_id,
                "external_status": o.status,
                "internal_status": "processed", # Placeholder
                "created_at": o.created_at.isoformat(),
                "items": [
                    {"sku": i.sku, "name": i.name, "quantity": i.quantity}
                    for i in o.items
                ]
            }
            for o in orders
        ]
    }
