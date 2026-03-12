
import asyncio
from sqlalchemy import select, or_
from app.db.session import AsyncSessionLocal
from app.models.whatsapp_message import WhatsAppMessage
from app.models.whatsapp_event import WhatsAppEvent

async def check_user_data():
    phone = "5511990115302"
    async with AsyncSessionLocal() as session:
        # Messages
        stmt = select(WhatsAppMessage).where(
            or_(WhatsAppMessage.from_phone == phone, WhatsAppMessage.to_phone == phone)
        ).order_by(WhatsAppMessage.wa_timestamp.asc())
        
        result = await session.execute(stmt)
        messages = result.scalars().all()
        print(f"Messages found for {phone}: {len(messages)}")
        for m in messages:
            print(f"  [{m.direction}] {m.wa_timestamp or m.created_at}: {m.body[:30]}... (Status: {m.status})")

        # Events with errors
        stmt_events = select(WhatsAppEvent).where(WhatsAppEvent.processed == False)
        result_events = await session.execute(stmt_events)
        events = result_events.scalars().all()
        print(f"\nUnprocessed/Error events: {len(events)}")
        for e in events:
            print(f"  Event: {e.event_type} | Error: {e.error}")

if __name__ == "__main__":
    asyncio.run(check_user_data())
