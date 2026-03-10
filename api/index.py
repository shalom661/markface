# Standard Vercel entry point for Python/FastAPI
import sys
import os
import logging

# Configure logging to see diagnostic information in Vercel 'Functions' logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the project root and backend directory to sys.path
# This ensures that 'from app.main import app' works correctly.
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(project_root, "backend")

if backend_dir not in sys.path:
    sys.path.append(backend_dir)
    logger.info(f"Adding backend directory to sys.path: {backend_dir}")

try:
    from app.main import app
    handler = app
    logger.info("✅ FastAPI app imported successfully from backend")
    
    # -------------------------------------------------------------------------
    # Health checks to verify the function is alive and routing is correct
    # -------------------------------------------------------------------------
    
    # Matches /api/health-check (if Vercel passes the full path)
    @app.get("/api/health-check")
    async def health_api_prefixed():
        return {"status": "ok", "mode": "prefixed", "service": "MarkFace Hub API"}

    # Matches /health-check (if Vercel strips /api/)
    @app.get("/health-check")
    async def health_api_direct():
        return {"status": "ok", "mode": "direct", "service": "MarkFace Hub API"}

except Exception as e:
    logger.error(f"❌ FATAL ERROR: Deployment Failure: {e}", exc_info=True)
    
    from fastapi import FastAPI
    handler = FastAPI()
    
    @handler.get("/{path:path}")
    async def report_error(path: str):
        return {
            "status": "error",
            "detail": "Failed to start MarkFace Hub API",
            "python_error": str(e),
            "requested_path": path
        }
