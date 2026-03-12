
import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check_data():
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT id, from_phone, to_phone, direction, body FROM whatsapp_messages;"))
            rows = result.fetchall()
            print(f"Messages in DB ({len(rows)}):")
            for row in rows:
                print(f"ID: {row[0]}, From: {row[1]}, To: {row[2]}, Dir: {row[3]}, Body: {row[4][:20]}...")
        except Exception as e:
            print(f"Error checking data: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
