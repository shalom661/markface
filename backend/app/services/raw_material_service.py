"""
app/services/raw_material_service.py
CRUD + autocomplete + duplicate logic for RawMaterial.
Fires domain events automatically.
"""

import uuid
from decimal import Decimal
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.raw_material import RawMaterial
from app.schemas.raw_material import RawMaterialCreate, RawMaterialUpdate
from app.services.event_service import create_event


# ── Allowed autocomplete fields (whitelist for safety) ────────────────────
_AUTOCOMPLETE_FIELDS = {
    "color", "composition", "unit", "subcategory", "category",
}


def _serialize_for_event(data: dict) -> dict:
    """Convert non-JSON-serializable values (Decimal, UUID, date) to strings."""
    import decimal
    from datetime import date as date_type
    result = {}
    for k, v in data.items():
        if isinstance(v, (decimal.Decimal, uuid.UUID)):
            result[k] = str(v)
        elif isinstance(v, date_type):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result


async def create_raw_material(
    db: AsyncSession, data: RawMaterialCreate
) -> RawMaterial:
    # Validate supplier exists if provided
    if data.supplier_id:
        from app.services.supplier_service import get_supplier_or_404
        await get_supplier_or_404(db, data.supplier_id)

    # Check unique internal_code
    if data.internal_code:
        existing = (
            await db.execute(
                select(RawMaterial).where(RawMaterial.internal_code == data.internal_code)
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Código interno '{data.internal_code}' já existe.",
            )

    material_data = data.model_dump()
    if material_data.get("last_unit_price") is None:
        material_data["last_unit_price"] = Decimal("0.00")
    material = RawMaterial(**material_data)
    db.add(material)
    await db.flush()
    await create_event(
        db,
        "RAW_MATERIAL_CREATED",
        {"raw_material_id": str(material.id), "category": material.category},
    )
    return material


from sqlalchemy.orm import selectinload

async def list_raw_materials(
    db: AsyncSession,
    category: str | None = None,
    supplier_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, Sequence[RawMaterial]]:
    try:
        # Base filters
        filters = []
        if category:
            filters.append(RawMaterial.category.ilike(category))
        if supplier_id:
            filters.append(RawMaterial.supplier_id == supplier_id)
        if search:
            pattern = f"%{search}%"
            filters.append(
                RawMaterial.description.ilike(pattern)
                | RawMaterial.internal_code.ilike(pattern)
            )

        # Count query
        count_q = select(func.count(RawMaterial.id))
        if filters:
            count_q = count_q.where(*filters)
        total_res = await db.execute(count_q)
        total = total_res.scalar() or 0

        # Data query with eager loading
        query = select(RawMaterial).options(selectinload(RawMaterial.supplier))
        if filters:
            query = query.where(*filters)
        
        query = query.order_by(RawMaterial.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        items_res = await db.execute(query)
        items = items_res.scalars().all()
        return total, items
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        # No production use isso! Apenas para debugar o erro 500 persistente.
        raise HTTPException(
            status_code=500,
            detail=f"DEBUG ERROR: {str(e)}\n\n{tb}"
        )


async def get_raw_material_or_404(
    db: AsyncSession, raw_material_id: uuid.UUID
) -> RawMaterial:
    result = await db.execute(
        select(RawMaterial).where(RawMaterial.id == raw_material_id)
    )
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matéria-prima não encontrada.",
        )
    return material


async def update_raw_material(
    db: AsyncSession, raw_material_id: uuid.UUID, data: RawMaterialUpdate
) -> RawMaterial:
    material = await get_raw_material_or_404(db, raw_material_id)
    changes = data.model_dump(exclude_none=True)

    # If internal_code is being changed, check uniqueness
    if "internal_code" in changes and changes["internal_code"] != material.internal_code:
        existing = (
            await db.execute(
                select(RawMaterial).where(
                    RawMaterial.internal_code == changes["internal_code"]
                )
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Código interno '{changes['internal_code']}' já existe.",
            )

    for field, value in changes.items():
        setattr(material, field, value)
    await db.flush()

    await create_event(
        db,
        "RAW_MATERIAL_UPDATED",
        {"raw_material_id": str(material.id), "changes": _serialize_for_event(changes)},
    )
    return material


async def delete_raw_material(db: AsyncSession, raw_material_id: uuid.UUID) -> None:
    """Hard delete: remove permanently."""
    material = await get_raw_material_or_404(db, raw_material_id)
    await db.delete(material)
    await db.flush()
    await create_event(
        db,
        "RAW_MATERIAL_DELETED",
        {"raw_material_id": str(raw_material_id), "internal_code": material.internal_code},
    )


async def toggle_raw_material_active(
    db: AsyncSession, raw_material_id: uuid.UUID
) -> RawMaterial:
    """Toggle the active status of a raw material."""
    material = await get_raw_material_or_404(db, raw_material_id)
    material.active = not material.active
    await db.flush()
    await create_event(
        db,
        "RAW_MATERIAL_STATUS_TOGGLED",
        {"raw_material_id": str(material.id), "active": material.active},
    )
    return material


async def duplicate_raw_material(
    db: AsyncSession, raw_material_id: uuid.UUID
) -> RawMaterial:
    """
    Duplicate a raw material — copies all fields except id, internal_code,
    created_at, updated_at. The internal_code is left blank for the user
    to fill in.
    """
    source = await get_raw_material_or_404(db, raw_material_id)

    new_material = RawMaterial(
        date=source.date,
        category=source.category,
        subcategory=source.subcategory,
        description=source.description,
        internal_code=None,  # blank — user fills in
        supplier_code=source.supplier_code,
        supplier_id=source.supplier_id,
        unit=source.unit,
        color=source.color,
        composition=source.composition,
        minimum_order=source.minimum_order,
        category_fields=dict(source.category_fields) if source.category_fields else None,
        last_unit_price=source.last_unit_price,
        active=True,
    )
    db.add(new_material)
    await db.flush()

    await create_event(
        db,
        "RAW_MATERIAL_DUPLICATED",
        {
            "raw_material_id": str(new_material.id),
            "source_id": str(source.id),
        },
    )
    return new_material


async def autocomplete(
    db: AsyncSession, field: str, prefix: str = "", limit: int = 20
) -> list[str]:
    """
    Return distinct non-null values for a given field, optionally filtered
    by a prefix. Supports base columns and dynamic keys in category_fields.
    """
    # Check if it's a base column
    if hasattr(RawMaterial, field) and field in _AUTOCOMPLETE_FIELDS:
        column = getattr(RawMaterial, field)
    else:
        # Assume it's a dynamic field in category_fields JSONB
        # We need to cast back to JSONB because of the TypeDecorator
        from sqlalchemy import cast
        from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
        column = cast(RawMaterial.category_fields, PG_JSONB)[field].astext

    query = (
        select(column)
        .where(column.isnot(None))
        .where(column != "")
        .distinct()
        .order_by(column)
        .limit(limit)
    )
    if prefix:
        query = query.where(column.ilike(f"{prefix}%"))

    result = await db.execute(query)
    return [str(row[0]) for row in result.all()]
