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
    
    # Diagnostic routes to see how Vercel is passing the path
    @app.get("/api/health-check")
    async def health_check_prefixed():
        return {"status": "ok", "source": "api/index.py", "path": "/api/health-check"}

    @app.get("/health-check")
    async def health_check_direct():
        return {"status": "ok", "source": "api/index.py", "path": "/health-check"}

    @app.middleware("http")
    async def log_request(request, call_next):
        logger.info(f"Incoming request: {request.method} {request.url.path}")
        return await call_next(request)

    logger.info("✅ FastAPI app imported and diagnostic routes added")
except Exception as e:
    logger.error(f"❌ FATAL: import failed: {e}", exc_info=True)
    raise e
