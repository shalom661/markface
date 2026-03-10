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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        purchase_data = schema.model_dump()
        items_data = purchase_data.pop("items")
        
        logger.info(f"Creating purchase type={purchase_data.get('type')} supplier={purchase_data.get('supplier_id')}")
        
        new_purchase = Purchase(**purchase_data)
        db.add(new_purchase)
        await db.flush()
        
        for item in items_data:
            logger.debug(f"Adding purchase item: {item}")
            pi = PurchaseItem(**item, purchase_id=new_purchase.id)
            db.add(pi)
            
            # Update last price of material or variant (Legacy, kept for quick reference)
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
        logger.info(f"Purchase created successfully: {new_purchase.id}")
        return new_purchase
    except Exception as e:
        logger.error(f"Error creating purchase: {e}", exc_info=True)
        await db.rollback()
        raise e

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
    for row in result.all():
        if row.total_qty and row.total_qty > 0:
            avg_prices[str(row.raw_material_id)] = row.total_spent / row.total_qty
    
    # Fill in materials that were never purchased using their last_unit_price
    all_materials = await db.execute(select(RawMaterial.id, RawMaterial.last_unit_price))
    for m in all_materials.all():
        m_id_str = str(m.id)
        if m_id_str not in avg_prices:
            avg_prices[m_id_str] = m.last_unit_price or Decimal("0.00")
            
    return avg_prices

async def get_variant_avg_prices(db: AsyncSession) -> dict[str, Decimal]:
    """Calculates the weighted average price for all product variants based on purchase history."""
    stmt = (
        select(
            PurchaseItem.variant_id,
            func.sum(PurchaseItem.quantity * PurchaseItem.unit_price).label("total_spent"),
            func.sum(PurchaseItem.quantity).label("total_qty")
        )
        .where(PurchaseItem.variant_id.is_not(None))
        .group_by(PurchaseItem.variant_id)
    )
    result = await db.execute(stmt)
    avg_prices = {}
    for row in result.all():
        if row.total_qty and row.total_qty > 0:
            avg_prices[str(row.variant_id)] = row.total_spent / row.total_qty
    
    # Fill in variants that were never purchased using their current 'cost'
    all_variants = await db.execute(select(ProductVariant.id, ProductVariant.cost))
    for v in all_variants.all():
        v_id_str = str(v.id)
        if v_id_str not in avg_prices:
            avg_prices[v_id_str] = v.cost or Decimal("0.00")
            
    return avg_prices

async def calculate_all_variant_costs(db: AsyncSession, modality_id: str):
    """Calculates yield prices for all variants for a specific modality using weighted averages."""
    # 1. Get Modality
    stmt = select(SalesModality).where(SalesModality.id == modality_id)
    res = await db.execute(stmt)
    modality = res.scalar_one_or_none()
    if not modality:
        return []

    # 2. Get Fixed Costs and Share
    fixed_costs = await list_fixed_costs(db)
    total_fixed = sum(c.value for c in fixed_costs)
    avg_monthly_production = Decimal("1000") # Estimate
    fixed_share = total_fixed / avg_monthly_production

    # 3. Get Average Prices from Purchases
    material_avg_prices = await get_raw_material_avg_prices(db)
    variant_avg_prices = await get_variant_avg_prices(db)

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
        current_cost = Decimal("0.00")
        if v.product.is_manufactured:
            for pm in v.materials:
                m_id = str(pm.raw_material_id)
                price = material_avg_prices.get(m_id, Decimal("0.00"))
                current_cost += pm.quantity * price
        else:
            # Resale product: Use weighted average cost from its purchases
            v_id = str(v.id)
            current_cost = variant_avg_prices.get(v_id, v.cost or Decimal("0.00"))

        # Base Cost = BOM + Fixed Share (only for manufactured)
        base_cost = current_cost + (fixed_share if v.product.is_manufactured else Decimal("0.00"))

        # Final Yield Formula: (Base Cost + Fixed Fee + Extra Cost) / (1 - Tax%)
        tax_rate = (modality.tax_percent or Decimal("0")) / Decimal("100")
        if tax_rate >= 1:
            yield_price = Decimal("0.00")
        else:
            yield_price = (base_cost + (modality.fixed_fee or Decimal("0")) + (modality.extra_cost or Decimal("0"))) / (1 - tax_rate)

        results.append({
            "product_name": v.product.name,
            "sku": v.sku,
            "bom_cost": current_cost,
            "fixed_share": fixed_share if v.product.is_manufactured else 0,
            "yield_price": yield_price
        })

    return results

def convert_quantity(qty: Decimal, unit_from: str | None, unit_to: str | None) -> Decimal:
    """Simple unit conversion helper."""
    if not unit_from or not unit_to:
        return qty
    
    u_from = unit_from.lower().strip()
    u_to = unit_to.lower().strip()
    
    if u_from == u_to:
        return qty
    
    # Common conversions
    conversions = {
        ("g", "kg"): Decimal("0.001"),
        ("gramas", "kg"): Decimal("0.001"),
        ("grama", "kg"): Decimal("0.001"),
        ("g", "quilograma"): Decimal("0.001"),
        ("kg", "g"): Decimal("1000"),
        ("cm", "m"): Decimal("0.01"),
        ("mm", "m"): Decimal("0.001"),
        ("milímetros", "m"): Decimal("0.001"),
        ("centímetros", "m"): Decimal("0.01"),
    }
    
    factor = conversions.get((u_from, u_to))
    if factor:
        return qty * factor
    
    return qty

async def get_detailed_variant_costs(db: AsyncSession, modality_id: str):
    """Calculates detailed yield prices and BOM breakdown for all variants."""
    # 1. Get Modality
    stmt = select(SalesModality).where(SalesModality.id == modality_id)
    res = await db.execute(stmt)
    modality = res.scalar_one_or_none()
    if not modality:
        return []

    # 2. Get Fixed Costs and Share
    fixed_costs = await list_fixed_costs(db)
    total_fixed = sum(c.value for c in fixed_costs)
    avg_monthly_production = Decimal("1000") # Estimate
    fixed_share = total_fixed / avg_monthly_production

    # 3. Get Average Prices from Purchases
    material_avg_prices = await get_raw_material_avg_prices(db)
    variant_avg_prices = await get_variant_avg_prices(db)

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
        bom_items = []
        bom_total = Decimal("0.00")
        
        if v.product.is_manufactured:
            for pm in v.materials:
                m_id = str(pm.raw_material_id)
                avg_price = material_avg_prices.get(m_id, Decimal("0.00"))
                
                # Handle Unit Conversion
                # pm.quantity is the amount used. pm.unit_override is the unit used in BOM.
                # pm.raw_material.unit is the unit of purchase/price.
                real_qty = convert_quantity(pm.quantity, pm.unit_override, pm.raw_material.unit)
                item_cost = real_qty * avg_price
                
                bom_items.append({
                    "material_name": pm.raw_material.description or pm.raw_material.category,
                    "quantity": pm.quantity,
                    "unit": pm.unit_override or pm.raw_material.unit,
                    "avg_price": avg_price,
                    "item_cost": item_cost
                })
                bom_total += item_cost
        else:
            # Resale product
            v_id = str(v.id)
            bom_total = variant_avg_prices.get(v_id, v.cost or Decimal("0.00"))
            bom_items.append({
                "material_name": "Custo de Aquisição (Revenda)",
                "quantity": 1,
                "unit": "un",
                "avg_price": bom_total,
                "item_cost": bom_total
            })

        # Base Cost = BOM + Fixed Share (only for manufactured)
        base_cost = bom_total + (fixed_share if v.product.is_manufactured else Decimal("0.00"))

        # Final Yield Formula
        tax_rate = (modality.tax_percent or Decimal("0")) / Decimal("100")
        if tax_rate >= 1:
            yield_price = Decimal("0.00")
        else:
            yield_price = (base_cost + (modality.fixed_fee or Decimal("0")) + (modality.extra_cost or Decimal("0"))) / (1 - tax_rate)

        results.append({
            "product_name": v.product.name,
            "sku": v.sku,
            "modality_name": modality.name,
            "materials": bom_items,
            "bom_total": bom_total,
            "fixed_share": fixed_share if v.product.is_manufactured else Decimal("0.00"),
            "base_cost": base_cost,
            "yield_price": yield_price,
            "tax_rate": tax_rate * 100,
            "fixed_fee": modality.fixed_fee or 0,
            "extra_cost": modality.extra_cost or 0
        })

    return results
