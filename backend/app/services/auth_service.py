"""
app/services/auth_service.py
Business logic for user registration, login and retrieval.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate
from fastapi import HTTPException, status


async def register_user(db: AsyncSession, data: UserCreate) -> User:
    """Create a new user, hashing the password. Raises 409 if email taken."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{data.email}' já cadastrado.",
        )
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()  # Get the id without committing
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    """Verify credentials and return JWT tokens. Raises 401 on failure."""
    result = await db.execute(select(User).where(User.email == email))
    user: User | None = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada.",
        )

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role, "email": user.email},
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
