
import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check_table():
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_messages');"))
            exists = result.scalar()
            print(f"Table 'whatsapp_messages' exists: {exists}")
            
            if exists:
                result = await session.execute(text("SELECT COUNT(*) FROM whatsapp_messages;"))
                count = result.scalar()
                print(f"Total messages in DB: {count}")
        except Exception as e:
            print(f"Error checking table: {e}")

if __name__ == "__main__":
    asyncio.run(check_table())
