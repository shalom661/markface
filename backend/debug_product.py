import asyncio
from app.db.session import async_session_maker
from app.services.product_service import create_product
from app.schemas.product import ProductCreate

async def run():
    async with async_session_maker() as session:
        payload = ProductCreate(
            name="PUAMA",
            description="AAAA",
            brand="MarkFace",
            active=True,
            is_manufactured=True,
            internal_code="PU-001",
            materials=[]
        )
        try:
            prod = await create_product(session, payload)
            print("SUCCESS:", prod.id)
        except Exception as e:
            print("ERROR:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
