import sys
import os

# Add backend directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

# Vercel looks for the variable 'app' in the entry point
# Alternatively, it looks for an object named 'handler'
handler = app
