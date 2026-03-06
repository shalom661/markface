"""
app/workers/celery_app.py
Celery application factory.
Configured to use Redis as both broker and result backend.
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "markface_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    # Retry settings
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Part 3: Periodic reconciliation every 10 minutes
    beat_schedule={
        "reconcile-inventory": {
            "task": "app.workers.tasks.reconcile_inventory_task",
            "schedule": 600,  # seconds (10 minutes)
        },
    },
)
