import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the project root and backend directory to sys.path
# Vercel's current working directory is usually the root of the project.
root_path = os.path.dirname(os.path.dirname(__file__))
backend_path = os.path.join(root_path, "backend")

if backend_path not in sys.path:
    sys.path.append(backend_path)
    logger.info(f"Added {backend_path} to sys.path")

try:
    from app.main import app
    handler = app
    logger.info("✅ Successfully imported FastAPI app from backend")
    
    # Add a direct health check that doesn't rely on the full backend logic
    @app.get("/api/health-check")
    async def health_check_simple():
        return {"status": "ok", "message": "Vercel function is alive", "backend": "imported"}

except Exception as e:
    logger.error(f"❌ FATAL: Failed to import app: {e}", exc_info=True)
    
    # Create a fallback app to report the error in the browser if building fails
    from fastapi import FastAPI
    handler = FastAPI()
    
    @handler.get("/api/health-check")
    async def health_check_error():
        return {"status": "error", "message": str(e)}
    
    @handler.get("/api/{path:path}")
    async def catch_all_error(path: str):
        return {"status": "critical_error", "detail": f"Function failed to start. Error: {e}"}
