# Models package — import all to ensure SQLAlchemy registers them
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.models.inventory import Inventory
from app.models.event_log import EventLog
from app.models.order import Order, OrderItem, InventoryMovement
from app.models.webhook_event import WebhookEvent
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial
from app.models.customer import Customer
from app.models.category import RawMaterialCategory
from app.models.unit import MeasurementUnit
from app.models.product_material import ProductMaterial
from app.models.product_category import ProductCategory
from app.models.site_config import SiteBanner, SiteFeaturedSection
from app.models.finance import FixedCost, SalesModality
from app.models.purchase import Purchase, PurchaseItem
from app.models.whatsapp_message import WhatsAppMessage
from app.models.whatsapp_event import WhatsAppEvent

__all__ = [
    "User", "Product", "ProductVariant", "Inventory", "EventLog",
    "Order", "OrderItem", "InventoryMovement", "WebhookEvent",
    "Supplier", "RawMaterial", "Customer", "RawMaterialCategory", "MeasurementUnit",
    "ProductMaterial", "ProductCategory", "SiteBanner", "SiteFeaturedSection",
    "FixedCost", "SalesModality", "Purchase", "PurchaseItem",
    "WhatsAppMessage", "WhatsAppEvent",
]
