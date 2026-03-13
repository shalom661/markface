
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.finance import SalesModality
from sqlalchemy import select

async def check_modalities():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(SalesModality))
        modalities = result.scalars().all()
        print("MODALITIES:")
        for m in modalities:
            print(f"- {m.name} (ID: {m.id})")

if __name__ == "__main__":
    asyncio.run(check_modalities())
