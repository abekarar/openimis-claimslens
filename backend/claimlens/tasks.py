import logging

from celery import shared_task
from core.models import User

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def preprocess_document(self, doc_uuid, user_id):
    from claimlens.models import Document, AuditLog
    from claimlens.services import DocumentService
    from claimlens.storage import ClaimlensStorage
    from claimlens.preprocessing import analyze_image

    try:
        user = User.objects.get(id=user_id)
        doc = Document.objects.get(id=doc_uuid)

        storage = ClaimlensStorage()
        file_bytes = storage.read(doc.storage_key)

        metadata = analyze_image(file_bytes, doc.mime_type)
        doc.preprocessing_metadata = metadata
        doc.save(user=user)

        AuditLog(
            document=doc,
            action=AuditLog.Action.PREPROCESS,
            details=metadata,
        ).save(user=user)

        logger.info("Preprocessing complete for document %s", doc_uuid)
        return str(doc_uuid)

    except Exception as exc:
        logger.error("Preprocessing failed for %s: %s", doc_uuid, exc)
        try:
            doc = Document.objects.get(id=doc_uuid)
            user = User.objects.get(id=user_id)
            DocumentService.update_status(doc, Document.Status.FAILED, user, str(exc))
            AuditLog(
                document=doc,
                action=AuditLog.Action.ERROR,
                details={'stage': 'preprocessing', 'error': str(exc)},
            ).save(user=user)
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def classify_document(self, doc_uuid, user_id):
    from claimlens.models import Document, DocumentType, AuditLog
    from claimlens.services import DocumentService
    from claimlens.storage import ClaimlensStorage
    from claimlens.engine.manager import EngineManager

    try:
        user = User.objects.get(id=user_id)
        doc = Document.objects.get(id=doc_uuid)

        DocumentService.update_status(doc, Document.Status.CLASSIFYING, user)

        storage = ClaimlensStorage()
        file_bytes = storage.read(doc.storage_key)

        doc_types = list(
            DocumentType.objects.filter(is_active=True, is_deleted=False).values(
                'code', 'name', 'classification_hints'
            )
        )

        if not doc_types:
            logger.warning("No document types configured, skipping classification")
            return str(doc_uuid)

        manager = EngineManager()
        result = manager.classify(file_bytes, doc.mime_type, doc_types)

        if result.success:
            code = result.data.get('document_type_code')
            doc_type = DocumentType.objects.filter(
                code=code, is_active=True, is_deleted=False
            ).first()

            if doc_type:
                doc.document_type = doc_type
                doc.classification_confidence = result.confidence
            doc.engine_config = manager.get_primary_engine_config()
            doc.save(user=user)

            AuditLog(
                document=doc,
                action=AuditLog.Action.CLASSIFY,
                details={
                    'document_type_code': code,
                    'confidence': result.confidence,
                    'engine': result.engine_name,
                    'tokens_used': result.tokens_used,
                },
                engine_config=doc.engine_config,
            ).save(user=user)
        else:
            logger.warning("Classification failed: %s", result.error)

        logger.info("Classification complete for document %s", doc_uuid)
        return str(doc_uuid)

    except Exception as exc:
        logger.error("Classification failed for %s: %s", doc_uuid, exc)
        try:
            doc = Document.objects.get(id=doc_uuid)
            user = User.objects.get(id=user_id)
            DocumentService.update_status(doc, Document.Status.FAILED, user, str(exc))
            AuditLog(
                document=doc,
                action=AuditLog.Action.ERROR,
                details={'stage': 'classification', 'error': str(exc)},
            ).save(user=user)
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def extract_document(self, doc_uuid, user_id):
    from claimlens.models import Document, ExtractionResult, AuditLog
    from claimlens.services import DocumentService
    from claimlens.storage import ClaimlensStorage
    from claimlens.engine.manager import EngineManager
    from claimlens.apps import ClaimlensConfig

    try:
        user = User.objects.get(id=user_id)
        doc = Document.objects.get(id=doc_uuid)

        DocumentService.update_status(doc, Document.Status.EXTRACTING, user)

        storage = ClaimlensStorage()
        file_bytes = storage.read(doc.storage_key)

        extraction_template = {}
        if doc.document_type and doc.document_type.extraction_template:
            extraction_template = doc.document_type.extraction_template

        manager = EngineManager()
        result = manager.extract(file_bytes, doc.mime_type, extraction_template)

        if not result.success:
            DocumentService.update_status(doc, Document.Status.FAILED, user, result.error)
            AuditLog(
                document=doc,
                action=AuditLog.Action.ERROR,
                details={'stage': 'extraction', 'error': result.error},
            ).save(user=user)
            return str(doc_uuid)

        fields = result.data.get('fields', {})
        field_confidences = {k: v.get('confidence', 0.0) for k, v in fields.items()}
        structured_data = {k: v.get('value') for k, v in fields.items()}
        aggregate_confidence = result.data.get('aggregate_confidence', result.confidence)

        extraction = ExtractionResult(
            document=doc,
            structured_data=structured_data,
            field_confidences=field_confidences,
            aggregate_confidence=aggregate_confidence,
            raw_llm_response=result.raw_response,
            processing_time_ms=result.processing_time_ms,
            tokens_used=result.tokens_used,
        )
        extraction.save(user=user)

        auto_threshold = ClaimlensConfig.auto_approve_threshold or 0.90
        review_threshold = ClaimlensConfig.review_threshold or 0.60

        if aggregate_confidence >= auto_threshold:
            final_status = Document.Status.COMPLETED
        elif aggregate_confidence >= review_threshold:
            final_status = Document.Status.REVIEW_REQUIRED
        else:
            final_status = Document.Status.FAILED

        DocumentService.update_status(doc, final_status, user)

        AuditLog(
            document=doc,
            action=AuditLog.Action.EXTRACT,
            details={
                'aggregate_confidence': aggregate_confidence,
                'field_count': len(fields),
                'final_status': final_status,
                'engine': result.engine_name,
                'tokens_used': result.tokens_used,
                'processing_time_ms': result.processing_time_ms,
            },
            engine_config=doc.engine_config,
        ).save(user=user)

        logger.info("Extraction complete for document %s → %s", doc_uuid, final_status)
        return str(doc_uuid)

    except Exception as exc:
        logger.error("Extraction failed for %s: %s", doc_uuid, exc)
        try:
            doc = Document.objects.get(id=doc_uuid)
            user = User.objects.get(id=user_id)
            DocumentService.update_status(doc, Document.Status.FAILED, user, str(exc))
            AuditLog(
                document=doc,
                action=AuditLog.Action.ERROR,
                details={'stage': 'extraction', 'error': str(exc)},
            ).save(user=user)
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def run_processing_pipeline(self, doc_uuid, user_id):
    from celery import chain
    pipeline = chain(
        preprocess_document.signature(
            args=(doc_uuid, user_id), queue='claimlens.preprocessing'
        ),
        classify_document.signature(
            args=(user_id,), queue='claimlens.classification'
        ),
        extract_document.signature(
            args=(user_id,), queue='claimlens.extraction'
        ),
    )
    pipeline.apply_async()
    logger.info("Processing pipeline started for document %s", doc_uuid)
