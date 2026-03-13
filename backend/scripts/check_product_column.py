import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Columns in 'products' table: {columns}")
            if 'is_on_website' in columns:
                print("SUCCESS: 'is_on_website' column exists.")
            else:
                print("ERROR: 'is_on_website' column is MISSING.")
        except Exception as e:
            print(f"Error checking column: {e}")

if __name__ == "__main__":
    asyncio.run(check())
