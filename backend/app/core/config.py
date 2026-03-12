"""
app/core/config.py
Centralised settings loaded from environment variables via pydantic-settings.
All consuming code imports `settings` from here.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "change-me"

    # ── JWT ────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-jwt"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://markface:markface_secret@postgres:5432/markface"

    # ── Redis / Celery ─────────────────────────────────────────────────────
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"

    # ── Seed ───────────────────────────────────────────────────────────────
    ADMIN_EMAIL: str = "admin@markface.com"
    ADMIN_PASSWORD: str = "Admin@1234"

    # ── WooCommerce Webhooks ─────────────────────────────────────────────
    WOO_WEBHOOK_SECRET: str = ""
    WOO_WEBHOOK_TOLERANCE_SECONDS: int = 300
    WOO_SKU_FIELD: str = "sku"

    # ── Part 3: Internal / Reconciliation ──────────────────────────────
    INTERNAL_API_KEY: str = "change-me-internal-api-key"
    RECONCILE_REPAIR: bool = False

    # ── WhatsApp Cloud API ─────────────────────────────────────────────
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "markface_hub_v1"
    WHATSAPP_API_VERSION: str = "v19.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton instance of Settings."""
    return Settings()


settings: Settings = get_settings()
