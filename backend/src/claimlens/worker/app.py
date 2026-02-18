from celery import Celery

from claimlens.config import settings

celery_app = Celery(
    "claimlens",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "claimlens.worker.tasks.preprocessing.*": {"queue": "preprocessing"},
        "claimlens.worker.tasks.classification.*": {"queue": "classification"},
        "claimlens.worker.tasks.extraction.*": {"queue": "extraction"},
    },
    task_default_queue="default",
)

celery_app.autodiscover_tasks(
    [
        "claimlens.worker.tasks.preprocessing",
        "claimlens.worker.tasks.classification",
        "claimlens.worker.tasks.extraction",
        "claimlens.worker.tasks.pipeline",
    ]
)
