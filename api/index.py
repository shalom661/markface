# api/index.py (v1.0.5 - Triggering Vercel Build)
import sys
import os
import logging

# Basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the project root and backend directory to sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(project_root, "backend")

if backend_dir not in sys.path:
    sys.path.append(backend_dir)
    logger.info(f"Adding backend directory to sys.path: {backend_dir}")

# Vercel's Python runtime detects 'app' in api/index.py
try:
    # 1. Import dependencies
    from app.main import app
    from app.core.config import settings
    from app.db.session import engine
    from sqlalchemy import text
    from sqlalchemy.engine.url import make_url

    # 2. Diagnostic Route
    @app.get("/api/health-check")
    async def health_check_diag():
        db_ok = False
        db_error = None
        db_host = "Unknown"
        try:
            # Extract host from DATABASE_URL for diagnostic (safe way)
            raw_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
            # Pre-process URL to fix common asyncpg/ssl issues
            if raw_url.startswith("postgres://"):
                raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
            if "sslmode=" in raw_url:
                raw_url = raw_url.replace("sslmode=require", "ssl=require").replace("sslmode=allow", "ssl=allow")
            
            url = make_url(raw_url)
            db_host = url.host
            
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                db_ok = True
        except Exception as ex:
            db_error = str(ex)

        return {
            "status": "ok",
            "database": "connected" if db_ok else "failed",
            "attempted_db_host": db_host,
            "db_error": db_error,
            "engine": "FastAPI via Vercel",
            "env": os.getenv("APP_ENV", "undefined")
        }

    # 3. Custom 404 handler for easier debugging
    from fastapi.responses import JSONResponse
    @app.exception_handler(404)
    async def custom_404_handler(request, exc):
        return JSONResponse(
            status_code=404,
            content={
                "detail": "Not Found",
                "requested_path": request.url.path,
                "msg": "FastAPI reached but no route matched.",
                "available": ["/api/v1", "/api/health-check"]
            }
        )

    @app.get("/api/v1/trigger-check")
    async def trigger_check():
        return {"status": "ok", "version": "1.0.4"}

    logger.info("✅ FastAPI app imported with diagnostic tools")

except Exception as e:
    logger.error(f"❌ FATAL: import failed: {e}", exc_info=True)
    
    # Fallback to report error in browser
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/{path:path}")
    async def report_crash(path: str):
        return {
            "status": "crash",
            "detail": "FastAPI failed to start",
            "python_error": str(e)
        }
