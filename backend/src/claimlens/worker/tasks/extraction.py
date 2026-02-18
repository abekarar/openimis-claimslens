import structlog

from claimlens.worker.app import celery_app

logger = structlog.get_logger()


@celery_app.task(name="claimlens.extract_fields", bind=True, max_retries=3)
def extract_fields(self, document_id: str, classification_result: dict) -> dict:
    """Extract structured fields from document via LLM engine."""
    logger.info("extraction_start", document_id=document_id)

    # TODO: Implement actual extraction
    # - Load document image from MinIO
    # - Load extraction template for document type
    # - Call engine manager extract()
    # - Store ExtractionResult
    # - Evaluate confidence and set routing decision

    return {
        "document_id": document_id,
        "fields": {},
        "aggregate_confidence": 0.0,
        "routing_decision": "review_required",
    }
