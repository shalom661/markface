import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating product_materials table to support variations...")
        
        # 1. Check if product_id exists and variant_id doesn't
        # Actually, it's safer to just try ADD COLUMN and DROP COLUMN IF EXISTS
        
        try:
            print("Adding variant_id column...")
            await conn.execute(text("ALTER TABLE product_materials ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_materials_variant_id ON product_materials (variant_id);"))
            print("Successfully added variant_id.")
        except Exception as e:
            print(f"Error adding variant_id: {e}")

        try:
            print("Adding unit_override column...")
            await conn.execute(text("ALTER TABLE product_materials ADD COLUMN IF NOT EXISTS unit_override VARCHAR(50);"))
            print("Successfully added unit_override.")
        except Exception as e:
            print(f"Error adding unit_override: {e}")

        try:
            print("Dropping old product_id column...")
            # Optional: Move data if needed, but since it's a new feature, we assume fresh start or manual fix
            await conn.execute(text("ALTER TABLE product_materials DROP COLUMN IF EXISTS product_id;"))
            print("Successfully dropped product_id.")
        except Exception as e:
            print(f"Error dropping product_id: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
