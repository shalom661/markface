from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db
from app.schemas.finance import FixedCostCreate, FixedCostRead, PurchaseCreate, PurchaseRead
from app.services import finance_service

router = APIRouter()

@router.get("/fixed-costs", response_model=list[FixedCostRead])
async def get_fixed_costs(db: AsyncSession = Depends(get_db)):
    return await finance_service.list_fixed_costs(db)

@router.post("/fixed-costs", response_model=FixedCostRead)
async def post_fixed_cost(schema: FixedCostCreate, db: AsyncSession = Depends(get_db)):
    return await finance_service.create_fixed_cost(db, schema)

@router.delete("/fixed-costs/{cost_id}")
async def remove_fixed_cost(cost_id: str, db: AsyncSession = Depends(get_db)):
    await finance_service.delete_fixed_cost(db, cost_id)
    return {"message": "Deleted"}

@router.get("/purchases", response_model=list[PurchaseRead])
async def get_purchases(db: AsyncSession = Depends(get_db)):
    return await finance_service.list_purchases(db)

@router.post("/purchases", response_model=PurchaseRead)
async def post_purchase(schema: PurchaseCreate, db: AsyncSession = Depends(get_db)):
    return await finance_service.create_purchase(db, schema)
