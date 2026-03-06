"""
app/routers/internal.py
Internal operations router — not exposed publicly.

Endpoints:
  POST /internal/orders/{order_id}/reprocess

Auth: X-Api-Key header (INTERNAL_API_KEY setting).
This is NOT a JWT-secured endpoint — intended for ops/admin tooling only.
"""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_db
from app.services.reprocess_service import reprocess_order

router = APIRouter(
    prefix="/internal",
    tags=["internal"],
)


async def _require_api_key(
    x_api_key: str = Header(default="", alias="x-api-key"),
) -> None:
    """Dependency: validates the X-Api-Key header against INTERNAL_API_KEY."""
    if not settings.INTERNAL_API_KEY or x_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )


@router.post(
    "/orders/{order_id}/reprocess",
    summary="Internal — reprocess order inventory reservations",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(_require_api_key)],
)
async def internal_reprocess_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Repair inventory reservations for a given order.

    Computes delta between expected reservation (from OrderItems) and actual
    net movements (reserve - release). Applies corrections with row-level locks.
    Returns per-SKU summary of changes made.
    """
    result = await reprocess_order(db, order_id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    await db.commit()
    return result
