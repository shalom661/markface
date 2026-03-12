
import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check_events_table():
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_events');"))
            exists = result.scalar()
            print(f"Table 'whatsapp_events' exists: {exists}")
            
            if exists:
                result = await session.execute(text("SELECT COUNT(*) FROM whatsapp_events;"))
                print(f"Total events in DB: {result.scalar()}")
        except Exception as e:
            print(f"Error checking table: {e}")

if __name__ == "__main__":
    asyncio.run(check_events_table())
