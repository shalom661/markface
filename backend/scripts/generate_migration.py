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
    message = sys.argv[1] if len(sys.argv) > 1 else 'Add product categories and site config'
    main(argv=['revision', '--autogenerate', '-m', message])
    print("Migration generated successfully.")
except Exception as e:
    print(f"Error: {e}")
