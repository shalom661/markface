
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.whatsapp_event import WhatsAppEvent

async def check_unprocessed_events():
    async with AsyncSessionLocal() as session:
        stmt = select(WhatsAppEvent).order_by(WhatsAppEvent.created_at.desc()).limit(10)
        result = await session.execute(stmt)
        events = result.scalars().all()
        for e in events:
            print(f"--- Event ID: {e.id} ---")
            print(f"Type: {e.event_type}")
            print(f"Processed: {e.processed}")
            print(f"Error: {e.error}")
            print(f"Payload: {e.payload}")

if __name__ == "__main__":
    asyncio.run(check_unprocessed_events())
