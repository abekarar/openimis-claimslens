import structlog

from claimlens.worker.app import celery_app

logger = structlog.get_logger()


@celery_app.task(name="claimlens.classify_document", bind=True, max_retries=3)
def classify_document(self, document_id: str, preprocess_result: dict) -> dict:
    """Classify document type via LLM engine."""
    logger.info("classification_start", document_id=document_id)

    # TODO: Implement actual classification
    # - Load document image from MinIO
    # - Call engine manager classify()
    # - Update document record with classification

    return {
        "document_id": document_id,
        "document_type": "claim_form",
        "confidence": 0.95,
    }
