from decimal import Decimal
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.finance import FixedCost, SalesModality
from app.models.purchase import Purchase, PurchaseItem
from app.models.product_material import ProductMaterial
from app.models.product import Product, ProductVariant
from app.models.raw_material import RawMaterial
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

async def get_raw_material_avg_prices(db: AsyncSession) -> dict[str, Decimal]:
    """Calculates the weighted average price for all raw materials based on purchase history."""
    stmt = (
        select(
            PurchaseItem.raw_material_id,
            func.sum(PurchaseItem.quantity * PurchaseItem.unit_price).label("total_spent"),
            func.sum(PurchaseItem.quantity).label("total_qty")
        )
        .where(PurchaseItem.raw_material_id.is_not(None))
        .group_by(PurchaseItem.raw_material_id)
    )
    result = await db.execute(stmt)
    avg_prices = {}
    for row in result:
        if row.total_qty and row.total_qty > 0:
            avg_prices[str(row.raw_material_id)] = row.total_spent / row.total_qty
    
    # Fill in materials that were never purchased using their last_unit_price
    all_materials = await db.execute(select(RawMaterial.id, RawMaterial.last_unit_price))
    for m in all_materials:
        m_id_str = str(m.id)
        if m_id_str not in avg_prices:
            avg_prices[m_id_str] = m.last_unit_price or Decimal("0.00")
            
    return avg_prices

async def calculate_all_variant_costs(db: AsyncSession, modality_id: str):
    """Calculates yield prices for all variants for a specific modality."""
    # 1. Get Modality
    stmt = select(SalesModality).where(SalesModality.id == modality_id)
    res = await db.execute(stmt)
    modality = res.scalar_one_or_none()
    if not modality:
        return []

    # 2. Get Fixed Costs and Share
    fixed_costs = await list_fixed_costs(db)
    total_fixed = sum(c.value for c in fixed_costs)
    avg_monthly_production = Decimal("1000") # As per requirement/plan
    fixed_share = total_fixed / avg_monthly_production

    # 3. Get Average Prices
    avg_prices = await get_raw_material_avg_prices(db)

    # 4. Get All Variants with their materials
    from sqlalchemy.orm import selectinload
    stmt = select(ProductVariant).options(
        selectinload(ProductVariant.product),
        selectinload(ProductVariant.materials).selectinload(ProductMaterial.raw_material)
    )
    res = await db.execute(stmt)
    variants = res.scalars().all()

    results = []
    for v in variants:
        # Calculate BOM Cost using average prices
        bom_cost = Decimal("0.00")
        if v.product.is_manufactured:
            for pm in v.materials:
                m_id = str(pm.raw_material_id)
                price = avg_prices.get(m_id, Decimal("0.00"))
                bom_cost += pm.quantity * price
        else:
            bom_cost = v.cost or Decimal("0.00")

        # Base Cost = BOM + Fixed Share
        base_cost = bom_cost + (fixed_share if v.product.is_manufactured else Decimal("0.00"))

        # Final Yield Formula: (Base Cost + Fixed Fee + Extra Cost) / (1 - Tax%)
        tax_rate = modality.tax_percent / Decimal("100")
        if tax_rate >= 1:
            yield_price = Decimal("0.00") # Guard against division by zero
        else:
            yield_price = (base_cost + modality.fixed_fee + modality.extra_cost) / (1 - tax_rate)

        results.append({
            "product_name": v.product.name,
            "sku": v.sku,
            "bom_cost": bom_cost,
            "fixed_share": fixed_share if v.product.is_manufactured else 0,
            "yield_price": yield_price
        })

    return results
