import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models.raw_material import RawMaterial
from app.models.product_material import ProductMaterial
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        # Check some materials
        res = await db.execute(select(RawMaterial).limit(5))
        materials = res.scalars().all()
        print("--- Materials ---")
        for m in materials:
            print(f"ID: {m.id}, Desc: {m.description}, Unit: {m.unit}, Price: {m.last_unit_price}")
        
        # Check some BOMs
        res = await db.execute(select(ProductMaterial).limit(5))
        boms = res.scalars().all()
        print("--- BOMs ---")
        for b in boms:
            print(f"Variant: {b.variant_id}, Mat: {b.raw_material_id}, Qty: {b.quantity}, UnitOverride: {b.unit_override}")

if __name__ == "__main__":
    asyncio.run(check())
