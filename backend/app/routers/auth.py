"""
app/routers/auth.py
Authentication endpoints: register, login, me.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo usuário (apenas admins)",
)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> User:
    """
    Admin-only endpoint to create a new user.
    To create the very first admin, use the seed script.
    """
    return await auth_service.register_user(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Autenticar e obter JWT",
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await auth_service.authenticate_user(db, data.email, data.password)


@router.get(
    "/me",
    response_model=UserRead,
    summary="Dados do usuário autenticado",
)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
