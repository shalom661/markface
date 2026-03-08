import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine
from app.models.product_material import ProductMaterial
from app.models.product import Product

async def migrate():
    async with engine.begin() as conn:
        print("Adding new columns to products table...")
        try:
            await conn.execute(text("ALTER TABLE products ADD COLUMN is_manufactured BOOLEAN DEFAULT TRUE NOT NULL;"))
            await conn.execute(text("ALTER TABLE products ADD COLUMN internal_code VARCHAR(120);"))
            await conn.execute(text("ALTER TABLE products ADD COLUMN supplier_code VARCHAR(120);"))
            await conn.execute(text("ALTER TABLE products ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;"))
            print("Successfully added new columns to products.")
        except Exception as e:
            print(f"Columns might already exist or error occurred: {e}")

        print("Creating product_materials table...")
        try:
            # We can use SQLAlchemy's create_all for this specific table if it doesn't exist
            await conn.run_sync(ProductMaterial.__table__.create, checkfirst=True)
            print("Successfully created product_materials table.")
        except Exception as e:
            print(f"Table might already exist or error occurred: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
