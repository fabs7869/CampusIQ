from celery import Celery
from app.config import settings

celery_app = Celery(
    "campusiq",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.workers.tasks.send_notification": {"queue": "notifications"},
        "app.workers.tasks.process_image": {"queue": "images"},
        "app.workers.tasks.update_analytics_cache": {"queue": "analytics"},
    },
)
