"""
app/services/product_service.py
CRUD business logic for Products and ProductVariants.
Fires domain events automatically.
"""

import uuid
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory
from app.models.product import Product, ProductVariant
from app.models.product_material import ProductMaterial
from app.schemas.product import ProductCreate, ProductUpdate, VariantCreate, VariantUpdate
from app.services.event_service import create_event


# ── Products ───────────────────────────────────────────────────────────────


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    data_dict = data.model_dump()
    variants_data = data_dict.pop("variants", [])

    product = Product(**data_dict)
    db.add(product)
    await db.flush() # Assigns ID

    for var_data in variants_data:
        materials_data = var_data.pop("materials", None)
        variant = ProductVariant(product_id=product.id, **var_data)
        db.add(variant)
        await db.flush()

        if product.is_manufactured and materials_data:
            for mat in materials_data:
                pm = ProductMaterial(
                    variant_id=variant.id,
                    raw_material_id=mat["raw_material_id"],
                    quantity=mat["quantity"],
                    unit_override=mat.get("unit_override"),
                )
                db.add(pm)
        
        # Auto-create inventory with 0 stock
        inventory = Inventory(variant_id=variant.id, stock_available=0, stock_reserved=0)
        db.add(inventory)

    await db.flush()

    # Create event
    await create_event(
        db,
        "PRODUCT_CREATED",
        {"product_id": str(product.id), "name": product.name, "is_manufactured": product.is_manufactured},
    )
    
    # FINAL STEP: Load the fully populated product
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.materials),
            selectinload(Product.variants).selectinload(ProductVariant.inventory)
        )
        .where(Product.id == product.id)
    )
    return result.scalar_one()


async def list_products(
    db: AsyncSession, page: int = 1, page_size: int = 20, active_only: bool = False, website_only: bool = False
) -> tuple[int, Sequence[Product]]:
    from sqlalchemy.orm import selectinload
    query = select(Product).options(
        selectinload(Product.variants).selectinload(ProductVariant.materials),
        selectinload(Product.variants).selectinload(ProductVariant.inventory)
    )
    if active_only:
        query = query.where(Product.active == True)  # noqa: E712
    if website_only:
        query = query.where(Product.is_on_website == True)  # noqa: E712
    query = query.order_by(Product.created_at.desc())

    from sqlalchemy import func
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    items = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return total, items


async def get_product_or_404(db: AsyncSession, product_id: uuid.UUID) -> Product:
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.materials),
            selectinload(Product.variants).selectinload(ProductVariant.inventory)
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
    return product


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate
) -> Product:
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        product = await get_product_or_404(db, product_id)
        data_dict = data.model_dump(exclude_unset=True)
        variants_data = data_dict.pop("variants", None)

        for field, value in data_dict.items():
            setattr(product, field, value)

        # Re-sync variants if provided
        if variants_data is not None:
            # 1. Map existing variants for faster lookup
            current_variants = {v.id: v for v in product.variants}
            
            # 2. Identify variants in payload
            # Handle string IDs from frontend safely
            updated_variant_ids = set()
            for v in variants_data:
                v_id_val = v.get("id")
                if v_id_val:
                    try:
                        updated_variant_ids.add(uuid.UUID(str(v_id_val)))
                    except ValueError:
                        pass # Ignore malformed IDs

            # 3. Remove variants not in payload
            for v_id in list(current_variants.keys()):
                if v_id not in updated_variant_ids:
                    variant_to_del = current_variants[v_id]
                    await db.delete(variant_to_del)
                    # Note: We don't need to manually remove from list, 
                    # SQLAlchemy handles it if cascade is set, but let's be safe
            
            # 4. Update or Create variants
            for v_data in variants_data:
                v_id_val = v_data.pop("id", None)
                v_id = None
                if v_id_val:
                    try:
                        v_id = uuid.UUID(str(v_id_val))
                    except ValueError:
                        v_id = None
                        
                materials_data = v_data.pop("materials", None)
                sku = v_data.get("sku")
                
                # Check SKU Uniqueness if SKU is changing or new
                if sku:
                    stmt = select(ProductVariant).where(ProductVariant.sku == sku)
                    if v_id:
                        stmt = stmt.where(ProductVariant.id != v_id)
                    
                    sku_conflict = (await db.execute(stmt)).scalar_one_or_none()
                    if sku_conflict:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"SKU '{sku}' já está em uso por outro produto."
                        )

                if v_id and v_id in current_variants:
                    # Update existing
                    variant = current_variants[v_id]
                    for f, val in v_data.items():
                        setattr(variant, f, val)
                else:
                    # Create new
                    variant = ProductVariant(product_id=product.id, **v_data)
                    db.add(variant)
                    await db.flush()
                    # Inventory for new variant
                    inventory = Inventory(variant_id=variant.id, stock_available=0, stock_reserved=0)
                    db.add(inventory)
                    await db.flush()

                # Sync Materials (BOM) for this variant
                if materials_data is not None:
                    variant.materials.clear()
                    if product.is_manufactured:
                        for mat in materials_data:
                            pm = ProductMaterial(
                                variant_id=variant.id,
                                raw_material_id=mat["raw_material_id"],
                                quantity=mat["quantity"],
                                unit_override=mat.get("unit_override"),
                            )
                            variant.materials.append(pm)

        await db.flush()
        
        await create_event(
            db,
            "PRODUCT_UPDATED",
            {"product_id": str(product.id), "changes": data.model_dump(mode="json", exclude_unset=True)},
        )
        
        # Reload fully
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Product)
            .options(
                selectinload(Product.variants).selectinload(ProductVariant.materials),
                selectinload(Product.variants).selectinload(ProductVariant.inventory)
            )
            .where(Product.id == product.id)
        )
        return result.scalar_one()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}", exc_info=True)
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Erro de integridade: SKU ou Código Interno já existe."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao atualizar produto: {str(e)}"
        )


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await get_product_or_404(db, product_id)
    await db.delete(product)
    await db.flush()
    await create_event(
        db,
        "PRODUCT_DELETED",
        {"product_id": str(product_id), "name": product.name},
    )


async def toggle_product_active(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = await get_product_or_404(db, product_id)
    product.active = not product.active
    await db.flush()
    await create_event(
        db,
        "PRODUCT_STATUS_TOGGLED",
        {"product_id": str(product_id), "active": product.active},
    )
    return product


async def toggle_product_website(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = await get_product_or_404(db, product_id)
    product.is_on_website = not product.is_on_website
    await db.flush()
    await create_event(
        db,
        "PRODUCT_WEBSITE_TOGGLED",
        {"product_id": str(product_id), "is_on_website": product.is_on_website},
    )
    return product


# ── Variants ───────────────────────────────────────────────────────────────


async def create_variant(
    db: AsyncSession, product_id: uuid.UUID, data: VariantCreate
) -> ProductVariant:
    # Ensure product exists
    await get_product_or_404(db, product_id)

    # Check SKU uniqueness
    sku_exists = (
        await db.execute(select(ProductVariant).where(ProductVariant.sku == data.sku))
    ).scalar_one_or_none()
    if sku_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"SKU '{data.sku}' já existe.",
        )

    variant = ProductVariant(product_id=product_id, **data.model_dump())
    db.add(variant)
    await db.flush()

    # Auto-create inventory with 0 stock
    inventory = Inventory(variant_id=variant.id, stock_available=0, stock_reserved=0)
    db.add(inventory)
    await db.flush()

    await create_event(
        db,
        "VARIANT_CREATED",
        {"variant_id": str(variant.id), "sku": variant.sku, "product_id": str(product_id)},
    )
    return variant


async def list_variants(
    db: AsyncSession,
    sku: str | None = None,
    active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, Sequence[ProductVariant]]:
    query = select(ProductVariant)
    if sku:
        query = query.where(ProductVariant.sku.ilike(f"%{sku}%"))
    if active is not None:
        query = query.where(ProductVariant.active == active)
    query = query.order_by(ProductVariant.sku)

    from sqlalchemy import func
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()
    items = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return total, items


async def get_variant_or_404(db: AsyncSession, variant_id: uuid.UUID) -> ProductVariant:
    result = await db.execute(
        select(ProductVariant).where(ProductVariant.id == variant_id)
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variante não encontrada."
        )
    return variant


async def update_variant(
    db: AsyncSession, variant_id: uuid.UUID, data: VariantUpdate
) -> ProductVariant:
    variant = await get_variant_or_404(db, variant_id)
    changes = data.model_dump(exclude_none=True)

    # If SKU is being changed, check uniqueness
    if "sku" in changes and changes["sku"] != variant.sku:
        sku_exists = (
            await db.execute(
                select(ProductVariant).where(ProductVariant.sku == changes["sku"])
            )
        ).scalar_one_or_none()
        if sku_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SKU '{changes['sku']}' já existe.",
            )

    for field, value in changes.items():
        setattr(variant, field, value)
    await db.flush()

    await create_event(
        db,
        "VARIANT_UPDATED",
        {"variant_id": str(variant.id), "changes": changes},
    )
    return variant


async def delete_variant(db: AsyncSession, variant_id: uuid.UUID) -> None:
    variant = await get_variant_or_404(db, variant_id)
    await db.delete(variant)
    await db.flush()
    await create_event(
        db,
        "VARIANT_DELETED",
        {"variant_id": str(variant_id), "sku": variant.sku},
    )


async def toggle_variant_active(db: AsyncSession, variant_id: uuid.UUID) -> ProductVariant:
    variant = await get_variant_or_404(db, variant_id)
    variant.active = not variant.active
    await db.flush()
    await create_event(
        db,
        "VARIANT_STATUS_TOGGLED",
        {"variant_id": str(variant_id), "active": variant.active},
    )
    return variant
