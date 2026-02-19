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
        result, routed_config = manager.classify_routed(
            file_bytes, doc.mime_type, doc_types,
            document_type_code=doc.document_type.code if doc.document_type else None,
        )

        if result.success:
            code = result.data.get('document_type_code')
            detected_language = result.data.get('language')

            doc_type = DocumentType.objects.filter(
                code=code, is_active=True, is_deleted=False
            ).first()

            if doc_type:
                doc.document_type = doc_type
                doc.classification_confidence = result.confidence
            if detected_language:
                doc.language = detected_language
            doc.engine_config = routed_config or manager.get_primary_engine_config()
            doc.save(user=user)

            AuditLog(
                document=doc,
                action=AuditLog.Action.CLASSIFY,
                details={
                    'document_type_code': code,
                    'confidence': result.confidence,
                    'language': detected_language,
                    'engine': result.engine_name,
                    'tokens_used': result.tokens_used,
                    'routed': routed_config is not None,
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

        doc_type_code = doc.document_type.code if doc.document_type else None
        manager = EngineManager()
        result, routed_config = manager.extract_routed(
            file_bytes, doc.mime_type, extraction_template,
            language=doc.language, document_type=doc.document_type,
            document_type_code=doc_type_code,
        )

        if not result.success:
            DocumentService.update_status(doc, Document.Status.FAILED, user, result.error)
            AuditLog(
                document=doc,
                action=AuditLog.Action.ERROR,
                details={'stage': 'extraction', 'error': result.error},
            ).save(user=user)
            return str(doc_uuid)

        fields = result.data.get('fields', {})
        field_confidences = {}
        structured_data = {}
        for k, v in fields.items():
            field_confidences[k] = v.get('confidence', 0.0)
            value = v.get('value')
            if isinstance(value, list):
                cleaned = []
                for item in value:
                    if isinstance(item, dict):
                        cleaned.append({ik: iv for ik, iv in item.items() if ik != 'confidence'})
                    else:
                        cleaned.append(item)
                structured_data[k] = cleaned
            else:
                structured_data[k] = value
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

        if routed_config and routed_config != doc.engine_config:
            doc.engine_config = routed_config
            doc.save(user=user)

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
                'routed': routed_config is not None,
            },
            engine_config=doc.engine_config,
        ).save(user=user)

        # Auto-update capability scores with extraction feedback
        if doc.language:
            from claimlens.services import EngineCapabilityScoreService
            EngineCapabilityScoreService.record_extraction_result(
                engine_config=doc.engine_config,
                language=doc.language,
                document_type=doc.document_type,
                confidence=aggregate_confidence,
                processing_time_ms=result.processing_time_ms,
                user=user,
            )

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


@shared_task(bind=True, max_retries=1)
def validate_upstream(self, doc_uuid, user_id):
    from claimlens.models import Document
    from claimlens.validation.upstream import UpstreamValidationService

    try:
        user = User.objects.get(id=user_id)
        doc = Document.objects.get(id=doc_uuid)

        service = UpstreamValidationService()
        service.validate(doc, user)

        logger.info("Upstream validation complete for document %s", doc_uuid)
        return str(doc_uuid)

    except Exception as exc:
        logger.error("Upstream validation failed for %s: %s", doc_uuid, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1)
def validate_downstream(self, doc_uuid, user_id):
    from claimlens.models import Document
    from claimlens.validation.downstream import DownstreamValidationService

    try:
        user = User.objects.get(id=user_id)
        doc = Document.objects.get(id=doc_uuid)

        service = DownstreamValidationService()
        service.validate(doc, user)

        logger.info("Downstream validation complete for document %s", doc_uuid)
        return str(doc_uuid)

    except Exception as exc:
        logger.error("Downstream validation failed for %s: %s", doc_uuid, exc)
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
