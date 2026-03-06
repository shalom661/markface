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
from app.schemas.product import ProductCreate, ProductUpdate, VariantCreate, VariantUpdate
from app.services.event_service import create_event


# ── Products ───────────────────────────────────────────────────────────────


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await create_event(
        db,
        "PRODUCT_CREATED",
        {"product_id": str(product.id), "name": product.name},
    )
    return product


async def list_products(
    db: AsyncSession, page: int = 1, page_size: int = 20, active_only: bool = False
) -> tuple[int, Sequence[Product]]:
    query = select(Product)
    if active_only:
        query = query.where(Product.active == True)  # noqa: E712
    query = query.order_by(Product.created_at.desc())

    from sqlalchemy import func
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    items = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return total, items


async def get_product_or_404(db: AsyncSession, product_id: uuid.UUID) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
    return product


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate
) -> Product:
    product = await get_product_or_404(db, product_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.flush()
    await create_event(
        db,
        "PRODUCT_UPDATED",
        {"product_id": str(product.id), "changes": data.model_dump(exclude_none=True)},
    )
    return product


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
