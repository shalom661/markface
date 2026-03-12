"""
app/main.py (v1.0.3 - Deployment Trigger)
FastAPI application factory.
- Mounts all routers under /api/v1
- Configures structured logging on startup
- CORS (allow all origins in dev; restrict in prod via env)
- OpenAPI enabled
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configure_logging, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup / teardown lifecycle."""
    configure_logging(debug=settings.APP_DEBUG)
    log = get_logger(__name__)
    log.info("MarkFace Hub API starting", env=settings.APP_ENV)
    yield
    log.info("MarkFace Hub API shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="MarkFace Hub API",
        description=(
            "Fundação do sistema MarkFace Hub — Seção 1.\n\n"
            "Endpoints versionados em `/api/v1`."
        ),
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ───────────────────────────────────────────────────────────────
    # Configuração EXTREMAMENTE permissiva para debugar erro de rede/CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Voltando para "*" mas com allow_credentials=False para não quebrar o browser
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # ── Routers ────────────────────────────────────────────────────────────
    from app.routers import auth, events, health, inventory, products, orders, stats, whatsapp
    from app.routers import internal, suppliers, raw_materials, import_data, customers, categories, units
    from app.api.endpoints import finance
    from app.routers.webhooks import woocommerce as woo_webhooks

    api_prefix = "/api/v1"
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(products.router, prefix=api_prefix)
    app.include_router(orders.router, prefix=api_prefix)
    app.include_router(stats.router, prefix=api_prefix)
    app.include_router(inventory.router, prefix=api_prefix)
    app.include_router(events.router, prefix=api_prefix)
    app.include_router(suppliers.router, prefix=api_prefix)
    app.include_router(raw_materials.router, prefix=api_prefix)
    app.include_router(customers.router, prefix=api_prefix)
    app.include_router(categories.router, prefix=api_prefix)
    app.include_router(units.router, prefix=api_prefix)
    app.include_router(finance.router, prefix=api_prefix, tags=["finance"])
    app.include_router(import_data.router, prefix=api_prefix)
    app.include_router(whatsapp.router, prefix=api_prefix)
    app.include_router(woo_webhooks.router, prefix=api_prefix)
    app.include_router(internal.router)          # /internal — no api prefix
    app.include_router(health.router)           # no version prefix for health

    # ── Root redirect ──────────────────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root():
        return {"service": "MarkFace Hub API", "docs": "/api/docs", "version": "1.0.0"}

    return app


app: FastAPI = create_app()
