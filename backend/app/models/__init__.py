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

__all__ = [
    "User", "Product", "ProductVariant", "Inventory", "EventLog",
    "Order", "OrderItem", "InventoryMovement", "WebhookEvent",
    "Supplier", "RawMaterial", "Customer", "RawMaterialCategory", "MeasurementUnit",
    "ProductMaterial"
]
