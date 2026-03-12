from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from pydantic import BaseModel
import httpx
from app.core.config import settings
from app.core.logging import get_logger
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])
log = get_logger(__name__)

class WhatsAppMessageRequest(BaseModel):
    to: str
    message: str

class WebhookResponse(BaseModel):
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

@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Handle incoming notifications from WhatsApp Cloud API.
    """
    data = await request.json()
    log.debug("WhatsApp Webhook received", data=data)
    
    # Process the message (e.g., save to DB, trigger real-time updates)
    # For now, we just log it.
    
    return {"status": "ok"}

@router.post("/send", status_code=status.HTTP_200_OK)
async def send_message(
    payload: WhatsAppMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a WhatsApp message using the Official Cloud API.
    """
    url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Clean the phone number (remove +, spaces, etc.)
    clean_to = "".join(filter(str.isdigit, payload.to))
    
    # WhatsApp requires the number to be in international format without the +
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
            response = await client.post(url, headers=headers, json=body)
            response_data = response.json()
            
            if response.status_code != 200:
                log.error("Failed to send WhatsApp message", status=response.status_code, error=response_data)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"WhatsApp API Error: {response_data.get('error', {}).get('message', 'Unknown error')}"
                )
            
            log.info("WhatsApp message sent successfully", to=clean_to, message_id=response_data.get("messages", [{}])[0].get("id"))
            return response_data
            
        except httpx.RequestError as exc:
            log.error("HTTP Request failed", error=str(exc))
            raise HTTPException(status_code=500, detail=f"Request to WhatsApp API failed: {str(exc)}")
