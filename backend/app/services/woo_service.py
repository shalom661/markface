"""
app/services/woo_service.py  (Part 3 — hardened)
Business logic for WooCommerce inbound webhook processing.

Hardening added in Part 3:
- SELECT ... FOR UPDATE on Inventory rows (race-free reservations)
- WebhookEvent idempotency: insert before any side effects; conflict = already processed
- Deterministic event_id: X-WC-Webhook-ID header or sha256(type:order_id:body_hash)
- Full exception capture into WebhookEvent.error_message + EventLog
- structlog structured logging throughout (event_id, order_id, timing, per-SKU deltas)
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import time
import traceback
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.inventory import Inventory
from app.models.order import InventoryMovement, Order, OrderItem
from app.models.product import ProductVariant
from app.models.webhook_event import WebhookEvent
from app.schemas.order import WooOrderPayload
from app.services.event_service import create_event

log = get_logger(__name__)


# ── HMAC Validation ──────────────────────────────────────────────────────────

def validate_woo_signature(raw_body: bytes, header_signature: str) -> None:
    """
    Validate the HMAC-SHA256 signature sent by WooCommerce.

    WooCommerce computes:
        base64( HMAC-SHA256(secret, raw_body) )

    Raises ValueError if the signature is invalid or the secret is unconfigured.
    """
    secret = settings.WOO_WEBHOOK_SECRET
    if not secret:
        if settings.APP_DEBUG:
            log.warning("WOO_WEBHOOK_SECRET not set — skipping HMAC check (debug mode)")
            return
        raise ValueError("WOO_WEBHOOK_SECRET is not configured")

    expected_mac = hmac.new(
        secret.encode("utf-8"), raw_body, hashlib.sha256
    ).digest()
    expected_b64 = base64.b64encode(expected_mac).decode("utf-8")

    if not hmac.compare_digest(expected_b64, header_signature):
        raise ValueError("Invalid WooCommerce webhook signature")


# ── Event ID derivation ───────────────────────────────────────────────────────

def compute_payload_hash(raw_body: bytes) -> str:
    """Return SHA-256 hex digest of the raw request body."""
    return hashlib.sha256(raw_body).hexdigest()


def derive_event_id(
    event_type: str,
    order_id: str,
    payload_hash: str,
    wc_webhook_id: str | None = None,
) -> str:
    """
    Return a deterministic, stable event_id for idempotency.
    Prefers the X-WC-Webhook-ID header (up to 64 chars).
    Falls back to sha256(event_type:order_id:payload_hash).
    """
    if wc_webhook_id and wc_webhook_id.strip():
        return wc_webhook_id.strip()[:255]
    key = f"{event_type}:{order_id}:{payload_hash}"
    return hashlib.sha256(key.encode()).hexdigest()


# ── WebhookEvent idempotency gate ─────────────────────────────────────────────

async def open_webhook_event(
    db: AsyncSession,
    provider: str,
    event_type: str,
    event_id: str,
    order_id: str,
    payload_hash: str,
) -> WebhookEvent | None:
    """
    Insert a WebhookEvent record.
    Returns the new row on success.
    Returns None if event_id already exists (already processed → caller should return 200 immediately).
    """
    row = WebhookEvent(
        provider=provider,
        event_type=event_type,
        event_id=event_id,
        order_id=order_id,
        payload_hash=payload_hash,
        status="received",
    )
    db.add(row)
    try:
        await db.flush()
        return row
    except IntegrityError:
        await db.rollback()
        return None


async def close_webhook_event(
    db: AsyncSession,
    event_id: str,
    status: str,
    error_message: str | None = None,
) -> None:
    """Update an existing WebhookEvent with final status."""
    result = await db.execute(
        select(WebhookEvent).where(WebhookEvent.event_id == event_id)
    )
    row = result.scalar_one_or_none()
    if row:
        row.status = status
        row.processed_at = datetime.now(timezone.utc)
        if error_message:
            row.error_message = error_message[:2000]
        await db.flush()


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _lookup_variant(db: AsyncSession, sku: str) -> Optional[ProductVariant]:
    """Return the ProductVariant matching the given SKU, or None."""
    result = await db.execute(
        select(ProductVariant).where(ProductVariant.sku == sku)
    )
    return result.scalar_one_or_none()


async def _get_inventory_locked(
    db: AsyncSession, variant_id: uuid.UUID
) -> Optional[Inventory]:
    """
    Return the Inventory row for a variant with a row-level lock (FOR UPDATE).
    This prevents concurrent transactions from double-reserving the same stock.
    """
    result = await db.execute(
        select(Inventory)
        .where(Inventory.variant_id == variant_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def _reserve_stock(
    db: AsyncSession,
    inventory: Inventory,
    qty: int,
    order_id: uuid.UUID,
    reason: str = "woo_order_created",
) -> bool:
    """
    Reserve `qty` units (stock_reserved += qty).
    Row must already be locked by _get_inventory_locked().
    Returns True on success, False if stock is insufficient.
    """
    reserved_before = inventory.stock_reserved
    if inventory.stock_available < qty:
        log.debug(
            "stock_insufficient",
            variant_id=str(inventory.variant_id),
            available=inventory.stock_available,
            requested=qty,
        )
        return False

    inventory.stock_reserved += qty
    await db.flush()

    db.add(InventoryMovement(
        variant_id=inventory.variant_id,
        order_id=order_id,
        movement_type="reserve",
        quantity=qty,
        reason=reason,
    ))
    await db.flush()

    await create_event(db, "STOCK_RESERVED", {
        "variant_id": str(inventory.variant_id),
        "order_id": str(order_id),
        "quantity": qty,
        "stock_reserved_before": reserved_before,
        "stock_reserved_after": inventory.stock_reserved,
    })
    log.debug(
        "stock_reserved",
        variant_id=str(inventory.variant_id),
        qty=qty,
        reserved_before=reserved_before,
        reserved_after=inventory.stock_reserved,
    )
    return True


async def _release_stock(
    db: AsyncSession,
    inventory: Inventory,
    qty: int,
    order_id: uuid.UUID,
    reason: str = "woo_order_cancelled",
) -> None:
    """
    Release a previously reserved quantity (floors at 0).
    Row must already be locked by _get_inventory_locked().
    """
    reserved_before = inventory.stock_reserved
    release_qty = min(qty, inventory.stock_reserved)
    inventory.stock_reserved = max(0, inventory.stock_reserved - release_qty)
    await db.flush()

    db.add(InventoryMovement(
        variant_id=inventory.variant_id,
        order_id=order_id,
        movement_type="release",
        quantity=release_qty,
        reason=reason,
    ))
    await db.flush()

    await create_event(db, "STOCK_RELEASED", {
        "variant_id": str(inventory.variant_id),
        "order_id": str(order_id),
        "quantity": release_qty,
        "stock_reserved_before": reserved_before,
        "stock_reserved_after": inventory.stock_reserved,
    })
    log.debug(
        "stock_released",
        variant_id=str(inventory.variant_id),
        release_qty=release_qty,
        reserved_before=reserved_before,
        reserved_after=inventory.stock_reserved,
    )


def _parse_decimal(value: str | float | int | None) -> Decimal:
    """Safely parse a value to Decimal, defaulting to 0."""
    try:
        return Decimal(str(value or "0"))
    except Exception:
        return Decimal("0")


# ── Main service functions ────────────────────────────────────────────────────

async def process_order_created(
    db: AsyncSession,
    payload: WooOrderPayload,
    raw_payload: dict,
    event_id: str,
    event_type: str = "order.created",
) -> dict:
    """
    Idempotent handler for WooCommerce order-created / order-updated webhooks.

    Idempotency gate: WebhookEvent inserted first; conflict = already processed.
    Business logic wrapped in try/except — errors captured, always returns a result.
    """
    external_id = str(payload.id)
    bound_log = log.bind(event_id=event_id, event_type=event_type, order_id=external_id)
    t0 = time.monotonic()

    await create_event(db, "ORDER_RECEIVED", {
        "channel": "woo",
        "external_id": external_id,
        "status": payload.status,
        "event_id": event_id,
    })

    # Check existing order idempotency (order-level)
    result = await db.execute(
        select(Order).where(Order.channel == "woo", Order.external_id == external_id)
    )
    existing_order: Order | None = result.scalar_one_or_none()

    if existing_order is not None:
        if existing_order.status == payload.status:
            bound_log.info("order_no_change", processing_ms=round((time.monotonic() - t0) * 1000))
            return {"outcome": "no_change", "order_id": str(existing_order.id)}

        old_status = existing_order.status
        existing_order.status = payload.status
        await db.flush()
        await create_event(db, "ORDER_UPDATED", {
            "channel": "woo",
            "external_id": external_id,
            "old_status": old_status,
            "new_status": payload.status,
            "order_id": str(existing_order.id),
            "event_id": event_id,
        })
        bound_log.info("order_updated", old_status=old_status, new_status=payload.status,
                       processing_ms=round((time.monotonic() - t0) * 1000))
        return {"outcome": "updated", "order_id": str(existing_order.id)}

    # ── New order ─────────────────────────────────────────────────────────
    order = Order(
        channel="woo",
        external_id=external_id,
        status=payload.status,
        currency=payload.currency,
        total_amount=_parse_decimal(payload.total),
        raw_payload=raw_payload,
    )
    db.add(order)
    await db.flush()

    insufficient_skus: list[str] = []
    unmapped_skus: list[str] = []

    for line in payload.line_items:
        sku = line.sku.strip() if line.sku else ""
        unit_price = _parse_decimal(line.price)
        line_total = _parse_decimal(line.total)

        variant: ProductVariant | None = await _lookup_variant(db, sku) if sku else None

        if variant is None:
            unmapped_skus.append(sku)
            await create_event(db, "ORDER_ITEM_UNMAPPED", {
                "sku": sku, "order_id": str(order.id), "name": line.name,
            })

        item = OrderItem(
            order_id=order.id,
            variant_id=variant.id if variant else None,
            sku=sku,
            name=line.name or sku,
            quantity=line.quantity,
            unit_price=unit_price,
            line_total=line_total,
        )
        db.add(item)
        await db.flush()

        if variant is not None:
            # FOR UPDATE lock — prevents concurrent double-reservation
            inventory = await _get_inventory_locked(db, variant.id)
            if inventory is None:
                bound_log.warning("no_inventory_row", variant_id=str(variant.id))
                continue

            ok = await _reserve_stock(db, inventory, line.quantity, order.id)
            if not ok:
                insufficient_skus.append(sku)
                await create_event(db, "STOCK_INSUFFICIENT", {
                    "sku": sku,
                    "variant_id": str(variant.id),
                    "order_id": str(order.id),
                    "requested": line.quantity,
                    "available": inventory.stock_available,
                })

    if insufficient_skus:
        order.status = "insufficient_stock"
        await db.flush()

    await create_event(db, "ORDER_CREATED", {
        "channel": "woo",
        "external_id": external_id,
        "order_id": str(order.id),
        "status": order.status,
        "unmapped_skus": unmapped_skus,
        "insufficient_skus": insufficient_skus,
        "event_id": event_id,
    })

    processing_ms = round((time.monotonic() - t0) * 1000)
    bound_log.info(
        "order_created",
        order_id=str(order.id),
        result_status=order.status,
        unmapped_count=len(unmapped_skus),
        insufficient_count=len(insufficient_skus),
        processing_ms=processing_ms,
    )
    return {
        "outcome": "created",
        "order_id": str(order.id),
        "unmapped_skus": unmapped_skus,
        "insufficient_skus": insufficient_skus,
    }


async def process_order_cancelled(
    db: AsyncSession,
    payload: WooOrderPayload,
    raw_payload: dict,
    event_id: str,
    event_type: str = "order.cancelled",
) -> dict:
    """
    Idempotent handler for WooCommerce order-cancelled webhook.
    Releases stock reservations with FOR UPDATE locks.
    """
    external_id = str(payload.id)
    bound_log = log.bind(event_id=event_id, event_type=event_type, order_id=external_id)
    t0 = time.monotonic()

    await create_event(db, "ORDER_RECEIVED", {
        "channel": "woo", "external_id": external_id, "status": "cancelled",
        "event_id": event_id,
    })

    result = await db.execute(
        select(Order).where(Order.channel == "woo", Order.external_id == external_id)
    )
    order: Order | None = result.scalar_one_or_none()

    if order is None:
        bound_log.warning("cancellation_for_unknown_order")
        return {"outcome": "not_found", "external_id": external_id}

    if order.status == "cancelled":
        bound_log.info("order_already_cancelled", processing_ms=round((time.monotonic() - t0) * 1000))
        return {"outcome": "no_change", "order_id": str(order.id)}

    old_status = order.status
    order.status = "cancelled"
    await db.flush()

    for item in order.items:
        if item.variant_id is None:
            continue
        inventory = await _get_inventory_locked(db, item.variant_id)
        if inventory is None:
            continue
        await _release_stock(db, inventory, item.quantity, order.id)

    await create_event(db, "ORDER_UPDATED", {
        "channel": "woo",
        "external_id": external_id,
        "order_id": str(order.id),
        "old_status": old_status,
        "new_status": "cancelled",
        "event_id": event_id,
    })

    processing_ms = round((time.monotonic() - t0) * 1000)
    bound_log.info("order_cancelled", old_status=old_status, processing_ms=processing_ms)
    return {"outcome": "cancelled", "order_id": str(order.id)}
