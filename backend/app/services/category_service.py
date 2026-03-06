import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.category import RawMaterialCategory
from app.schemas.category import CategoryCreate, CategoryUpdate

async def list_categories(db: AsyncSession, active_only: bool = True) -> Sequence[RawMaterialCategory]:
    query = select(RawMaterialCategory)
    if active_only:
        query = query.where(RawMaterialCategory.active == True)
    query = query.order_by(RawMaterialCategory.name)
    result = await db.execute(query)
    return result.scalars().all()

async def create_category(db: AsyncSession, data: CategoryCreate) -> RawMaterialCategory:
    # Check for duplicate
    existing = await db.execute(select(RawMaterialCategory).where(RawMaterialCategory.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Categoria '{data.name}' já existe.")
    
    category = RawMaterialCategory(**data.model_dump())
    db.add(category)
    await db.flush()
    return category

async def update_category(db: AsyncSession, category_id: uuid.UUID, data: CategoryUpdate) -> RawMaterialCategory:
    category = await get_category_or_404(db, category_id)
    
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(category, field, value)
    
    await db.flush()
    return category

async def get_category_or_404(db: AsyncSession, category_id: uuid.UUID) -> RawMaterialCategory:
    result = await db.execute(select(RawMaterialCategory).where(RawMaterialCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
    return category

async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> None:
    category = await get_category_or_404(db, category_id)
    await db.delete(category)
    await db.flush()

async def toggle_category_active(db: AsyncSession, category_id: uuid.UUID) -> RawMaterialCategory:
    category = await get_category_or_404(db, category_id)
    category.active = not category.active
    await db.flush()
    return category

async def seed_categories(db: AsyncSession):
    """Seed initial categories with their fields if the table is empty."""
    query = select(RawMaterialCategory)
    result = await db.execute(query)
    if result.scalars().first():
        return

    # Mapeamento do antigo category-config.ts para o banco
    initial_data = [
        {
            "name": "Tecidos",
            "fields": [
                {"name": "tipo_tecido", "label": "Tipo de Tecido", "type": "text", "placeholder": "Ex: Meia Malha"},
                {"name": "rendimento", "label": "Rendimento (m/kg)", "type": "number", "step": "0.01"},
                {"name": "largura", "label": "Largura (m)", "type": "number", "step": "0.01"},
                {"name": "gramatura", "label": "Gramatura (g/m²)", "type": "number"},
                {"name": "estampa", "label": "Estampa", "type": "text"},
                {"name": "info_etiqueta", "label": "Info p/ Etiqueta", "type": "text"},
            ]
        },
        {
            "name": "Botões",
            "fields": [
                {"name": "tipo", "label": "Tipo", "type": "text"},
                {"name": "tamanho", "label": "Tamanho", "type": "text"},
                {"name": "furos", "label": "Furos", "type": "number"},
                {"name": "pezinho", "label": "Tem Pezinho?", "type": "text", "placeholder": "Sim/Não"},
            ]
        },
        {
            "name": "Zíper",
            "fields": [
                {"name": "tipo", "label": "Tipo", "type": "text"},
                {"name": "comprimento", "label": "Comprimento (cm)", "type": "number"},
                {"name": "cursor", "label": "Cursor", "type": "text"},
                {"name": "cor_dentes", "label": "Cor dos Dentes", "type": "text"},
                {"name": "cor_cursor", "label": "Cor do Cursor", "type": "text"},
            ]
        },
        {"name": "Elástico", "fields": [{"name": "largura", "label": "Largura (mm)", "type": "number"}]},
        {
            "name": "Linha",
            "fields": [
                {"name": "resistencia", "label": "Resistência", "type": "text"},
                {"name": "aplicacao", "label": "Aplicação", "type": "text", "placeholder": "Ex: Overlock, Reta"},
                {"name": "espessura", "label": "Espessura", "type": "text"},
                {"name": "cabos", "label": "Nº de Cabos", "type": "number"},
            ]
        },
        {
            "name": "Etiqueta",
            "fields": [
                {"name": "largura", "label": "Largura (cm)", "type": "number", "step": "0.1"},
                {"name": "comprimento", "label": "Comprimento (cm)", "type": "number", "step": "0.1"},
            ]
        },
        {
            "name": "Bordado",
            "fields": [
                {"name": "largura", "label": "Largura (cm)", "type": "number", "step": "0.1"},
                {"name": "comprimento", "label": "Comprimento (cm)", "type": "number", "step": "0.1"},
                {"name": "pontos", "label": "Nº de Pontos", "type": "number"},
            ]
        },
        {
            "name": "Embalagem",
            "fields": [
                {"name": "largura", "label": "Largura (cm)", "type": "number", "step": "0.1"},
                {"name": "comprimento", "label": "Comprimento (cm)", "type": "number", "step": "0.1"},
            ]
        },
        {
            "name": "Fio de Acabamento",
            "fields": [
                {"name": "tipo", "label": "Tipo", "type": "text"},
                {"name": "largura", "label": "Largura", "type": "text"},
                {"name": "comprimento", "label": "Comprimento", "type": "text"},
                {"name": "diametro", "label": "Diâmetro", "type": "text"},
                {"name": "espessura", "label": "Espessura", "type": "text"},
            ]
        },
        {
            "name": "Renda",
            "fields": [
                {"name": "tipo", "label": "Tipo", "type": "text"},
                {"name": "comprimento", "label": "Comprimento", "type": "text"},
                {"name": "largura", "label": "Largura", "type": "text"},
                {"name": "espessura", "label": "Espessura", "type": "text"},
            ]
        },
        {
            "name": "Gola",
            "fields": [
                {"name": "tipo", "label": "Tipo", "type": "text"},
                {"name": "largura", "label": "Largura", "type": "text"},
                {"name": "comprimento", "label": "Comprimento", "type": "text"},
                {"name": "estampa", "label": "Estampa", "type": "text"},
                {"name": "espessura", "label": "Espessura", "type": "text"},
            ]
        }
    ]
    
    for item in initial_data:
        db.add(RawMaterialCategory(name=item["name"], fields=item["fields"]))
    await db.flush()
