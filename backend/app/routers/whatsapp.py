from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from pydantic import BaseModel
import httpx
import traceback
from sqlalchemy import select, desc, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.logging import get_logger
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.whatsapp_message import WhatsAppMessage

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])
log = get_logger(__name__)

class WhatsAppMessageRequest(BaseModel):
    to: str
    message: str

class MessageSchema(BaseModel):
    id: str
    sender: str
    text: str
    time: str
    status: str

@router.get("/webhook")
async def verify_webhook(
    verify_token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge"),
    mode: str = Query(None, alias="hub.mode")
):
    """
    Webhook verification for WhatsApp Cloud API.
    """
    if mode == "subscribe" and verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        log.info("Webhook verified successfully")
        return int(challenge)
    
    log.error("Webhook verification failed", mode=mode, token=verify_token)
    raise HTTPException(status_code=403, detail="Verification failed")

def standardize_phone(phone: str) -> str:
    """Standardize phone numbers to include 55 prefix if missing (assuming Brazil)."""
    digits = "".join(filter(str.isdigit, phone))
    if len(digits) == 11 and not digits.startswith("55"):
        return f"55{digits}"
    return digits

@router.get("/debug")
async def debug_whatsapp(db: AsyncSession = Depends(get_db)):
    """Diagnostic endpoint to check WhatsApp configuration and DB state."""
    try:
        # Check DB
        res = await db.execute(text("SELECT COUNT(*) FROM whatsapp_messages"))
        count = res.scalar()
        
        return {
            "status": "online",
            "database": {
                "table_exists": True,
                "message_count": count
            },
            "config": {
                "token_set": bool(settings.WHATSAPP_TOKEN),
                "phone_id_set": bool(settings.WHATSAPP_PHONE_NUMBER_ID),
                "business_id_set": bool(settings.WHATSAPP_BUSINESS_ACCOUNT_ID),
                "api_version": settings.WHATSAPP_API_VERSION,
                "verify_token": settings.WHATSAPP_VERIFY_TOKEN
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "config_preview": {
                "token_prefix": settings.WHATSAPP_TOKEN[:10] if settings.WHATSAPP_TOKEN else "None"
            }
        }

@router.post("/webhook")
async def receive_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle incoming notifications from WhatsApp Cloud API.
    """
    try:
        data = await request.json()
        log.info("WhatsApp Webhook received", data=data) # Changed to info for visibility
        
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Check for incoming messages
                for msg in value.get("messages", []):
                    from_phone = standardize_phone(msg.get("from"))
                    wa_id = msg.get("id")
                    body = msg.get("text", {}).get("body", "")
                    wa_ts = msg.get("timestamp")
                    
                    # Idempotency: Check if message already exists
                    stmt = select(WhatsAppMessage).where(WhatsAppMessage.wa_id == wa_id)
                    res = await db.execute(stmt)
                    if res.scalar_one_or_none():
                        log.debug("Duplicate message received, skipping", wa_id=wa_id)
                        continue

                    # Convert timestamp
                    wa_datetime = None
                    if wa_ts:
                        wa_datetime = datetime.fromtimestamp(int(wa_ts), tz=timezone.utc)
                    
                    new_msg = WhatsAppMessage(
                        wa_id=wa_id,
                        from_phone=from_phone,
                        to_phone=settings.WHATSAPP_PHONE_NUMBER_ID,
                        body=body,
                        direction="inbound",
                        status="received",
                        wa_timestamp=wa_datetime
                    )
                    db.add(new_msg)
                    log.info("Saved inbound WhatsApp message", from_phone=from_phone, wa_id=wa_id)
                
                # Check for status updates
                for status_update in value.get("statuses", []):
                    wa_id = status_update.get("id")
                    new_status = status_update.get("status")
                    
                    stmt = select(WhatsAppMessage).where(WhatsAppMessage.wa_id == wa_id)
                    res = await db.execute(stmt)
                    existing_msg = res.scalar_one_or_none()
                    if existing_msg:
                        existing_msg.status = new_status
                        log.debug("WhatsApp status updated", wa_id=wa_id, status=new_status)

        await db.commit()
        return {"status": "ok"}
    except Exception as e:
        log.error("CRITICAL error in WhatsApp webhook", error=str(e), traceback=traceback.format_exc())
        await db.rollback()
        # Return 200 to Meta so they stop retrying a broken payload, 
        # but technically we should fix the parsing
        return {"status": "error", "message": str(e)}

@router.get("/history/{phone_number}", response_model=List[MessageSchema])
async def get_chat_history(
    phone_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch message history for a specific contact.
    """
    clean_phone = standardize_phone(phone_number)
    log.debug("Fetching chat history", phone=clean_phone)
    
    # Fetch messages where phone matches either from or to
    stmt = select(WhatsAppMessage).where(
        (WhatsAppMessage.from_phone == clean_phone) | 
        (WhatsAppMessage.to_phone == clean_phone)
    ).order_by(WhatsAppMessage.wa_timestamp.asc())
    
    try:
        result = await db.execute(stmt)
        messages = result.scalars().all()
        log.debug("History fetched", count=len(messages))
        
        return [
            MessageSchema(
                id=str(msg.id),
                sender="other" if msg.direction == "inbound" else "me",
                text=msg.body,
                time=msg.wa_timestamp.strftime("%H:%M") if msg.wa_timestamp else msg.created_at.strftime("%H:%M"),
                status=msg.status
            )
            for msg in messages
        ]
    except Exception as e:
        log.error("Error fetching chat history", error=str(e))
        raise HTTPException(status_code=500, detail="Erro ao carregar histórico de mensagens.")

@router.post("/send", status_code=status.HTTP_200_OK)
async def send_message(
    payload: WhatsAppMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a WhatsApp message and save to history.
    """
    url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    
    clean_to = standardize_phone(payload.to)
    log.info("Sending message", to=clean_to, body=payload.message)
    
    body = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_to,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": payload.message
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=body, timeout=10.0)
            response_data = response.json()
            
            if response.status_code != 200:
                error_msg = response_data.get('error', {}).get('message', 'Erro desconhecido na Meta API')
                log.error("Failed to send WhatsApp message", status=response.status_code, error=error_msg)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Meta API Error: {error_msg}"
                )
            
            # Save outbound message to DB
            wa_id = response_data.get("messages", [{}])[0].get("id")
            new_msg = WhatsAppMessage(
                wa_id=wa_id,
                from_phone=settings.WHATSAPP_PHONE_NUMBER_ID,
                to_phone=clean_to,
                body=payload.message,
                direction="outbound",
                status="sent",
                wa_timestamp=datetime.now(timezone.utc)
            )
            db.add(new_msg)
            await db.commit()
            
            log.info("WhatsApp message sent successfully", to=clean_to, wa_id=wa_id)
            return response_data
            
        except httpx.TimeoutException:
            log.error("Timeout connecting to Meta API")
            raise HTTPException(status_code=504, detail="Tempo de resposta da Meta API esgotado.")
        except HTTPException:
            raise
        except Exception as exc:
            log.error("WhatsApp Send Critical Error", error=str(exc), traceback=traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(exc)}")
