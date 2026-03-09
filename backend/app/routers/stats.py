from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardData
from app.services import dashboard_service

router = APIRouter(tags=["Dashboard"])

@router.get(
    "/stats/dashboard",
    response_model=DashboardData,
    summary="Obter estatísticas do Dashboard",
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> DashboardData:
    return await dashboard_service.get_dashboard_data(db)
