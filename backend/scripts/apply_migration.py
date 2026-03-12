import os
import sys

# Get the backend directory (where alembic.ini is)
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

try:
    from alembic.config import main
    print(f"Alembic config imported successfully. Backend dir: {backend_dir}")
    # Change to backend dir so it finds alembic.ini
    os.chdir(backend_dir)
    main(argv=['upgrade', 'head'])
except ImportError as e:
    print(f"Import Error: {e}")
except Exception as e:
    print(f"Error: {e}")
