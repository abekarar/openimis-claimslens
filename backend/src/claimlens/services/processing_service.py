import uuid

import structlog

from claimlens.models.document import DocumentStatus
from claimlens.services.document_service import DocumentService

logger = structlog.get_logger()


class ProcessingService:
    def __init__(self, document_service: DocumentService):
        self.document_service = document_service

    async def submit_for_processing(self, document_id: uuid.UUID) -> bool:
        document = await self.document_service.get_document(document_id)
        if document is None:
            return False

        if document.status != DocumentStatus.PENDING:
            logger.warning(
                "document_not_pending",
                document_id=str(document_id),
                status=document.status,
            )
            return False

        # Dispatch to Celery pipeline
        from claimlens.worker.tasks.pipeline import process_document_pipeline

        process_document_pipeline.delay(str(document_id))

        logger.info("processing_submitted", document_id=str(document_id))
        return True
