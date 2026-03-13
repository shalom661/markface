import asyncio
from app.db.session import AsyncSessionLocal
from app.models.finance import SalesModality
from sqlalchemy import select
from decimal import Decimal

async def seed():
    async with AsyncSessionLocal() as session:
        # Check if already exists
        result = await session.execute(
            select(SalesModality).where(SalesModality.name == "Website")
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            print("Creating 'Website' modality...")
            website = SalesModality(
                name="Website",
                tax_percent=Decimal("10.00"),
                fixed_fee=Decimal("0.00"),
                extra_cost=Decimal("0.00")
            )
            session.add(website)
            await session.commit()
            print("Website modality created successfully.")
        else:
            print("'Website' modality already exists.")

if __name__ == "__main__":
    asyncio.run(seed())
