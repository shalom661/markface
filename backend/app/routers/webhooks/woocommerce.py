"""
app/routers/webhooks/woocommerce.py  (Part 3 — hardened)
FastAPI router for WooCommerce inbound webhooks.

Changes vs. Part 2:
- Extracts X-WC-Webhook-ID and X-WC-Webhook-Topic headers for deterministic event_id
- Computes payload_hash from raw body bytes
- WebhookEvent idempotency gate: open_webhook_event() before any business logic
- Exception capture: errors → WebhookEvent.error_message + EventLog; always 200 to Woo
"""

import hashlib
import json
import logging
import traceback

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.order import WooOrderPayload
from app.services.woo_service import (
    close_webhook_event,
    compute_payload_hash,
    derive_event_id,
    open_webhook_event,
    process_order_cancelled,
    process_order_created,
    validate_woo_signature,
)

log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/webhooks/woocommerce",
    tags=["webhooks-woocommerce"],
)

_SIGNATURE_HEADER = "x-wc-webhook-signature"


async def _validate_and_parse(
    request: Request,
    x_wc_webhook_signature: str = Header(default="", alias=_SIGNATURE_HEADER),
) -> tuple[WooOrderPayload, dict, bytes]:
    """
    Shared dependency:
    1. Read raw body bytes.
    2. Validate HMAC signature.
    3. Parse JSON into WooOrderPayload.
    Returns (parsed_payload, raw_dict, raw_body) on success; 401 on bad signature.
    """
    raw_body: bytes = await request.body()

    try:
        validate_woo_signature(raw_body, x_wc_webhook_signature)
    except ValueError as exc:
        log.warning("WooCommerce webhook signature rejected: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )

    try:
        raw_dict = json.loads(raw_body)
        payload = WooOrderPayload.model_validate(raw_dict)
    except Exception as exc:
        log.error("Failed to parse WooCommerce payload: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid WooCommerce payload: {exc}",
        )

    return payload, raw_dict, raw_body


def _extract_event_id(
    request: Request,
    event_type: str,
    order_id: str,
    payload_hash: str,
) -> str:
    """Derive event_id from WC header or deterministic hash."""
    wc_id = request.headers.get("x-wc-webhook-id", "").strip()
    return derive_event_id(event_type, order_id, payload_hash, wc_id or None)


async def _process_with_gate(
    db: AsyncSession,
    request: Request,
    parsed: tuple[WooOrderPayload, dict, bytes],
    event_type: str,
    handler,
) -> dict:
    """
    Shared orchestration for all webhook endpoints:
    1. Compute payload_hash + event_id.
    2. Open WebhookEvent (idempotency gate).
    3. Run business handler.
    4. Close WebhookEvent with final status.
    All exceptions are caught and recorded; always return a valid dict (200 to Woo).
    """
    payload, raw_dict, raw_body = parsed
    order_id = str(payload.id)
    payload_hash = compute_payload_hash(raw_body)
    event_id = _extract_event_id(request, event_type, order_id, payload_hash)

    # Idempotency gate
    we = await open_webhook_event(db, "woocommerce", event_type, event_id, order_id, payload_hash)
    if we is None:
        # Already processed — idempotent duplicate
        log.info("Webhook %s already processed, ignoring", event_id)
        return {"ok": True, "outcome": "ignored", "event_id": event_id}

    try:
        result = await handler(db, payload, raw_dict, event_id=event_id, event_type=event_type)
        await close_webhook_event(db, event_id, "processed")
        await db.commit()
        return {"ok": True, **result}

    except Exception as exc:
        err_msg = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        log.error("Webhook processing failed for event_id=%s: %s", event_id, err_msg)
        try:
            # Roll back business changes, then record the failure
            await db.rollback()
            await close_webhook_event(db, event_id, "failed", error_message=err_msg)
            from app.services.event_service import create_event
            await create_event(db, "WEBHOOK_FAILED", {
                "event_id": event_id,
                "event_type": event_type,
                "order_id": order_id,
                "error": str(exc)[:500],
            })
            await db.commit()
        except Exception as inner:
            log.error("Failed to record webhook failure: %s", inner)
        # Always 200 to Woo to prevent retry storm
        return {"ok": True, "outcome": "error_recorded", "event_id": event_id}


@router.post(
    "/order-created",
    summary="WooCommerce — order.created webhook",
    status_code=status.HTTP_200_OK,
)
async def woo_order_created(
    request: Request,
    parsed: tuple[WooOrderPayload, dict, bytes] = Depends(_validate_and_parse),
    db: AsyncSession = Depends(get_db),
):
    """Receive a WooCommerce order.created event and process it idempotently."""
    return await _process_with_gate(db, request, parsed, "order.created", process_order_created)


@router.post(
    "/order-updated",
    summary="WooCommerce — order.updated webhook",
    status_code=status.HTTP_200_OK,
)
async def woo_order_updated(
    request: Request,
    parsed: tuple[WooOrderPayload, dict, bytes] = Depends(_validate_and_parse),
    db: AsyncSession = Depends(get_db),
):
    """
    Receive a WooCommerce order.updated event.
    Handled identically to order-created — service manages status transitions.
    """
    return await _process_with_gate(db, request, parsed, "order.updated", process_order_created)


@router.post(
    "/order-cancelled",
    summary="WooCommerce — order.cancelled webhook",
    status_code=status.HTTP_200_OK,
)
async def woo_order_cancelled(
    request: Request,
    parsed: tuple[WooOrderPayload, dict, bytes] = Depends(_validate_and_parse),
    db: AsyncSession = Depends(get_db),
):
    """Receive a WooCommerce order.cancelled event and release stock reservations."""
    return await _process_with_gate(db, request, parsed, "order.cancelled", process_order_cancelled)
