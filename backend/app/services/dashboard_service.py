import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.order import Order
from app.models.customer import Customer
from app.schemas.dashboard import DashboardData, DashboardStats, ChartDataPoint

async def get_dashboard_data(db: AsyncSession) -> DashboardData:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Total Products
    total_products = await db.scalar(select(func.count(Product.id)).where(Product.active == True))
    
    # 2. Orders Today
    orders_today = await db.scalar(
        select(func.count(Order.id))
        .where(Order.created_at >= today_start)
    )
    
    # 3. Active Customers
    active_customers = await db.scalar(
        select(func.count(Customer.id))
        .where(Customer.active == True)
    )
    
    # 4. Monthly Revenue
    monthly_revenue = await db.scalar(
        select(func.sum(Order.total_amount))
        .where(Order.created_at >= month_start)
    ) or Decimal("0.00")
    
    # Dummy trends for now as per schema requirement, but logic is real
    stats = DashboardStats(
        total_products=total_products or 0,
        orders_today=orders_today or 0,
        active_customers=active_customers or 0,
        monthly_revenue=monthly_revenue,
        revenue_change="+0%", # To be implemented with historical comparison
        products_change="+0%",
        orders_change="+0%",
        customers_change="+0%"
    )
    
    # 5. Chart Data (Mocking last 12 months for now but structure is ready)
    # real query would be grouped by month
    chart_data = [
        ChartDataPoint(label="JAN", value=45),
        ChartDataPoint(label="FEV", value=60),
        ChartDataPoint(label="MAR", value=monthly_revenue.to_integral_value() if monthly_revenue > 0 else 45),
    ]
    
    return DashboardData(stats=stats, revenue_chart=chart_data)
