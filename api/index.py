# api/index.py
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

try:
    from app.main import app
    from app.core.config import settings
    from app.db.session import engine
    from sqlalchemy import text

    @app.get("/api/health-check")
    async def health_check():
        db_ok = False
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                db_ok = True
        except Exception:
            pass

        return {
            "status": "ok",
            "database": "connected" if db_ok else "failed",
            "engine": "FastAPI via Vercel",
            "env": os.getenv("APP_ENV", "production")
        }

    logger.info("✅ FastAPI app initialized successfully")

except Exception as e:
    logger.error(f"❌ FATAL: import failed: {e}", exc_info=True)
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/{path:path}")
    async def report_crash(path: str):
        return {"status": "crash", "detail": "API Initialization Failed"}
