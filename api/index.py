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
    logger.info(f"Adding backend directory: {backend_dir}")

# Vercel's Python runtime automatically detects the 'app' variable 
# and treats it as an ASGI application if it's a FastAPI instance.
# IMPORTANT: do NOT use 'handler = app' as it can trigger legacy class checks.
try:
    from app.main import app
    from app.db.session import engine
    from app.core.config import settings
    from sqlalchemy import text
    
    # Extract host from DATABASE_URL for diagnostic (safe way)
    from sqlalchemy.engine.url import make_url
    url = make_url(os.getenv("DATABASE_URL", settings.DATABASE_URL))
            db_host = url.host
            
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                db_ok = True
        except Exception as e:
            db_error = str(e)

        return {
            "status": "ok",
            "database": "connected" if db_ok else "failed",
            "attempted_db_host": db_host,
            "db_error": db_error,
            "engine": "FastAPI via Vercel",
            "env": os.getenv("APP_ENV", "undefined")
        }

    # Custom 404 handler to see what path FastAPI is actually receiving
    @app.exception_handler(404)
    async def custom_404_handler(request, exc):
        return {
            "detail": "Not Found",
            "requested_path": request.url.path,
            "msg": "If you see this, FastAPI reached the 404 handler. Check if the path matches your routers.",
            "available_routers": ["/api/v1", "/api/health-check"]
        }

    logger.info("✅ FastAPI app imported with diagnostic tools")
except Exception as e:
    logger.error(f"❌ FATAL: import failed: {e}", exc_info=True)
    raise e
