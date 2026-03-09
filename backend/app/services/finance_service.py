from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.finance import FixedCost, SalesModality
from app.models.purchase import Purchase, PurchaseItem
from app.schemas.finance import FixedCostCreate, PurchaseCreate, SalesModalityCreate

async def list_fixed_costs(db: AsyncSession):
    result = await db.execute(select(FixedCost))
    return result.scalars().all()

async def create_fixed_cost(db: AsyncSession, schema: FixedCostCreate):
    new_cost = FixedCost(**schema.model_dump())
    db.add(new_cost)
    await db.commit()
    await db.refresh(new_cost)
    return new_cost

async def delete_fixed_cost(db: AsyncSession, cost_id):
    await db.execute(delete(FixedCost).where(FixedCost.id == cost_id))
    await db.commit()

async def list_purchases(db: AsyncSession):
    result = await db.execute(select(Purchase))
    return result.scalars().all()

async def create_purchase(db: AsyncSession, schema: PurchaseCreate):
    from app.models.raw_material import RawMaterial
    from app.models.product import ProductVariant
    
    purchase_data = schema.model_dump()
    items_data = purchase_data.pop("items")
    
    new_purchase = Purchase(**purchase_data)
    db.add(new_purchase)
    await db.flush()
    
    for item in items_data:
        pi = PurchaseItem(**item, purchase_id=new_purchase.id)
        db.add(pi)
        
        # Update last price of material or variant
        if item.get("raw_material_id"):
            stmt = select(RawMaterial).where(RawMaterial.id == item["raw_material_id"])
            res = await db.execute(stmt)
            material = res.scalar_one_or_none()
            if material:
                material.last_unit_price = item["unit_price"]
        
        if item.get("variant_id"):
            stmt = select(ProductVariant).where(ProductVariant.id == item["variant_id"])
            res = await db.execute(stmt)
            variant = res.scalar_one_or_none()
            if variant:
                variant.cost = item["unit_price"]
    
    await db.commit()
    await db.refresh(new_purchase)
    return new_purchase

async def list_sales_modalities(db: AsyncSession):
    result = await db.execute(select(SalesModality))
    return result.scalars().all()

async def create_sales_modality(db: AsyncSession, schema: SalesModalityCreate):
    new_modality = SalesModality(**schema.model_dump())
    db.add(new_modality)
    await db.commit()
    await db.refresh(new_modality)
    return new_modality

async def delete_sales_modality(db: AsyncSession, modality_id: str):
    await db.execute(delete(SalesModality).where(SalesModality.id == modality_id))
    await db.commit()
