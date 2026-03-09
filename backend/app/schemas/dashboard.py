from decimal import Decimal
from pydantic import BaseModel

class DashboardStats(BaseModel):
    total_products: int
    orders_today: int
    active_customers: int
    monthly_revenue: Decimal
    revenue_change: str  # e.g., "+12%"
    products_change: str
    orders_change: str
    customers_change: str

class ChartDataPoint(BaseModel):
    label: str
    value: float

class DashboardData(BaseModel):
    stats: DashboardStats
    revenue_chart: list[ChartDataPoint]
