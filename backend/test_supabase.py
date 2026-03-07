import asyncio
import asyncpg

async def test_conn():
    try:
        conn = await asyncpg.connect('postgresql://postgres.tmlqucdlsirtbzwphbyw:DMGfUsn6r.fkLL-@aws-0-us-east-1.pooler.supabase.com:5432/postgres')
        print("Success! Connected to Supabase.")
        version = await conn.fetchval('SELECT version();')
        print(f"Version: {version}")
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test_conn())

