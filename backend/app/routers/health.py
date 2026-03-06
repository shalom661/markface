"""
app/routers/health.py
Health-check endpoint: verifies DB and Redis connectivity.
"""

import asyncio

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Healthcheck (DB + Redis)",
    response_class=JSONResponse,
)
async def health() -> JSONResponse:
    """
    Returns 200 if both Postgres and Redis are reachable.
    Returns 503 with details if any service is down.
    """
    checks: dict[str, str] = {}
    all_ok = True

    # ── Database check ──────────────────────────────────────────────────────
    try:
        from app.db.session import engine
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"
        all_ok = False

    # ── Redis check ─────────────────────────────────────────────────────────
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await r.ping()
        await r.aclose()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"
        all_ok = False

    http_status = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        content={"status": "healthy" if all_ok else "degraded", "checks": checks},
        status_code=http_status,
    )
