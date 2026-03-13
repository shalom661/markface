import asyncio
from app.db.session import AsyncSessionLocal
from app.models.finance import SalesModality
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(SalesModality))
        items = result.scalars().all()
        print([i.name for i in items])

if __name__ == "__main__":
    asyncio.run(check())
