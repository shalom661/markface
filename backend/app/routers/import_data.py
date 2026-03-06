"""
app/routers/import_data.py
Import endpoints:
 - GET  /import/templates  → list available templates
 - GET  /import/template/{type}  → download a specific Excel template
 - POST /import/raw-materials  → upload filled Excel and import
"""

from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.services import import_service

router = APIRouter(prefix="/import", tags=["Importação"])

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

TEMPLATE_OPTIONS = {
    "raw-materials": {
        "label": "Matérias-Primas",
        "description": "Tecidos, Botões, Zíperes, Elásticos, Bordados, etc.",
        "filename": "template_materias_primas.xlsx",
        "icon": "scissors",
    },
    "suppliers": {
        "label": "Fornecedores",
        "description": "Cadastro de fornecedores de matéria-prima.",
        "filename": "template_fornecedores.xlsx",
        "icon": "truck",
    },
    "inventory": {
        "label": "Estoque",
        "description": "Entrada em estoque de matérias-primas ou produtos acabados.",
        "filename": "template_estoque.xlsx",
        "icon": "archive",
    },
}


@router.get("/templates", summary="Lista os templates de importação disponíveis")
async def list_templates(current_user: User = Depends(get_current_user)):
    result = []
    for key, info in TEMPLATE_OPTIONS.items():
        file_path = TEMPLATES_DIR / info["filename"]
        result.append({
            "key": key,
            "label": info["label"],
            "description": info["description"],
            "icon": info["icon"],
            "available": file_path.exists(),
        })
    return result


@router.get(
    "/template/{template_type}",
    summary="Baixar planilha modelo para importação",
)
async def download_template(
    template_type: str,
    request_token: Optional[str] = Query(default=None, alias="token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Serve a template file. Accepts auth via:
    - Authorization: Bearer <token>  (normal API calls)
    - ?token=<jwt>  (for browser window.open / direct download links)
    """
    from fastapi import Request
    from app.core.security import decode_token
    from sqlalchemy import select

    # Try to decode whatever token we got (we don't need the full user object for a file download)
    token_str = request_token
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido. Faça login novamente.",
        )

    try:
        payload = decode_token(token_str)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado.")

    if template_type not in TEMPLATE_OPTIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_type}' não encontrado.",
        )

    info = TEMPLATE_OPTIONS[template_type]
    file_path = TEMPLATES_DIR / info["filename"]

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Arquivo '{info['filename']}' não encontrado no servidor.",
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"modelo_{template_type}.xlsx",
        headers={"Content-Disposition": f'attachment; filename="modelo_{template_type}.xlsx"'},
    )


@router.post(
    "/raw-materials",
    summary="Importar matérias-primas via planilha Excel (.xlsx)",
    status_code=status.HTTP_200_OK,
)
async def import_raw_materials_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (file.filename or "").endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo deve ser uma planilha Excel (.xlsx ou .xls)",
        )

    contents = await file.read()
    result = await import_service.import_raw_materials_from_excel(db, contents)
    return result
