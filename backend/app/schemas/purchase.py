from enum import Enum

class PurchaseType(str, Enum):
    RAW_MATERIAL = "raw_material"
    RESALE_PRODUCT = "resale_product"
