import structlog
from celery import chain

from claimlens.worker.app import celery_app
from claimlens.worker.tasks.classification import classify_document
from claimlens.worker.tasks.extraction import extract_fields
from claimlens.worker.tasks.preprocessing import preprocess_document

logger = structlog.get_logger()


@celery_app.task(name="claimlens.process_document_pipeline")
def process_document_pipeline(document_id: str) -> None:
    """Orchestrate full document processing pipeline as a Celery chain."""
    logger.info("pipeline_start", document_id=document_id)

    pipeline = chain(
        preprocess_document.s(document_id),
        classify_document.s(document_id),
        extract_fields.s(document_id),
    )
    pipeline.apply_async()
