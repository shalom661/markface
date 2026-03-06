"""
app/services/import_service.py
Service to parse and import Excel files into the database.
"""

from io import BytesIO
from typing import Any
import openpyxl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.raw_material import RawMaterial
from app.models.supplier import Supplier

# Maps the Excel column key (from the template) to the correct model field / category_field
COLUMN_KEYS = [
    "data", "categoria", "sub_categoria", "descricao", "codigo_interno",
    "codigo_fornecedor", "fornecedor", "unidade", "valor_unidade", "cor",
    "composicao", "pedido_minimo",
    "tipo_tecido", "rendimento", "largura", "gramatura", "estampa_tecido", "info_etiqueta",
    "tipo_botao", "tamanho_botao", "furos_botao", "tem_pezinho",
    "tipo_ziper", "comp_ziper", "cursor_ziper", "cor_dentes_ziper", "cor_cursor_ziper",
    "largura_elastico",
    "resist_linha", "aplic_linha", "espessura_linha", "num_cabos_linha",
    "larg_etiqueta", "comp_etiqueta",
    "larg_bordado", "comp_bordado", "pontos_bordado",
    "larg_embalagem", "comp_embalagem",
    "tipo_gen", "larg_gen", "comp_gen", "diametro_gen", "espessura_gen", "estampa_gen",
]

# Fields that go directly to category_fields JSONB (everything except these go to model columns)
MODEL_FIELDS = {"descricao", "categoria", "sub_categoria", "codigo_interno", "fornecedor", "unidade"}

# Friendly validation for required fields
REQUIRED_FIELDS = ["categoria", "descricao", "unidade"]


def _clean(val: Any) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


async def _get_supplier_map(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(Supplier).where(Supplier.active == True))
    suppliers = result.scalars().all()
    return {sup.name.lower().strip(): str(sup.id) for sup in suppliers}


async def import_raw_materials_from_excel(
    db: AsyncSession,
    file_contents: bytes,
) -> dict:
    wb = openpyxl.load_workbook(BytesIO(file_contents), data_only=True)

    # Try to find the 'Matérias-Primas' sheet; if not found use the first sheet
    if "Matérias-Primas" in wb.sheetnames:
        ws = wb["Matérias-Primas"]
    else:
        ws = wb.active

    supplier_map = await _get_supplier_map(db)

    created = 0
    errors = []
    skipped = 0

    # Data starts at row 4 (row 1 = group headers, row 2 = col names, row 3 = example)
    for row_idx, row in enumerate(ws.iter_rows(min_row=4, values_only=True), start=4):
        # Skip completely empty rows
        if all(v is None or str(v).strip() == "" for v in row):
            skipped += 1
            continue

        # Map values to keys based on column order
        row_data: dict[str, str | None] = {}
        for i, key in enumerate(COLUMN_KEYS):
            val = row[i] if i < len(row) else None
            row_data[key] = _clean(val)

        # Check required fields
        missing = [f for f in REQUIRED_FIELDS if not row_data.get(f)]
        if missing:
            errors.append({
                "row": row_idx,
                "error": f"Campos obrigatórios faltando: {', '.join(missing)}",
                "data": {k: v for k, v in row_data.items() if v},
            })
            continue

        # Resolve supplier
        supplier_id = None
        sup_name = row_data.get("fornecedor")
        if sup_name and sup_name.lower().strip() in supplier_map:
            supplier_id = supplier_map[sup_name.lower().strip()]

        # Build category fields from all non-model, non-empty fields
        category_fields: dict[str, Any] = {}
        for key, val in row_data.items():
            if key in MODEL_FIELDS or not val:
                continue
            category_fields[key] = val

        # Create the RawMaterial record directly
        material = RawMaterial(
            description=row_data["descricao"],
            internal_code=row_data.get("codigo_interno"),
            category=row_data["categoria"],
            subcategory=row_data.get("sub_categoria"),
            unit=row_data["unidade"],
            supplier_id=supplier_id,
            category_fields=category_fields,
            active=True,
        )
        db.add(material)
        created += 1

    await db.commit()

    return {
        "message": f"Importação concluída: {created} itens criados, {len(errors)} erros, {skipped} linhas vazias ignoradas.",
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }
