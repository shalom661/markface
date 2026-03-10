import sys
import os

# Add backend directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

try:
    from app.main import app
    handler = app
except Exception as e:
    # If the app fails to import, this allows seeing the error in the function logs
    import logging
    logging.error(f"Failed to import app: {e}")
    raise e
