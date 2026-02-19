import logging
from datetime import datetime as py_datetime

from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction

from core.services import BaseService
from core.signals import register_service_signal
from core.services.utils import check_authentication, output_exception, output_result_success, model_representation

from claimlens.apps import ClaimlensConfig
from claimlens.models import (
    Document, DocumentType, EngineConfig, AuditLog, ExtractionResult,
    EngineCapabilityScore, RoutingPolicy, ValidationRule, ValidationResult,
    ValidationFinding, RegistryUpdateProposal, EngineRoutingRule,
)
from claimlens.validations import (
    DocumentValidation, DocumentTypeValidation, EngineConfigValidation,
    EngineCapabilityScoreValidation, ValidationRuleValidation, RegistryUpdateProposalValidation,
    EngineRoutingRuleValidation,
)

logger = logging.getLogger(__name__)


def _get_fernet():
    import base64
    import hashlib
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


class DocumentService(BaseService):
    OBJECT_TYPE = Document

    def __init__(self, user, validation_class=DocumentValidation):
        super().__init__(user, validation_class)

    @check_authentication
    @register_service_signal('claimlens.document.upload')
    def upload(self, obj_data):
        try:
            with transaction.atomic():
                DocumentValidation.validate_upload(self.user, **obj_data)
                obj_data['status'] = Document.Status.PENDING
                doc = Document(**obj_data)
                doc.save(user=self.user)

                AuditLog(
                    document=doc,
                    action=AuditLog.Action.UPLOAD,
                    details={
                        'filename': doc.original_filename,
                        'mime_type': doc.mime_type,
                        'file_size': doc.file_size,
                    },
                ).save(user=self.user)

                return output_result_success(dict_representation=model_representation(doc))
        except Exception as exc:
            return output_exception(model_name='Document', method='upload', exception=exc)

    @check_authentication
    @register_service_signal('claimlens.document.start_processing')
    def start_processing(self, document_uuid):
        try:
            with transaction.atomic():
                doc = Document.objects.get(id=document_uuid, is_deleted=False)
                DocumentValidation.validate_process(self.user, doc)
                doc.status = Document.Status.PREPROCESSING
                doc.save(user=self.user)

                AuditLog(
                    document=doc,
                    action=AuditLog.Action.STATUS_CHANGE,
                    details={'from': Document.Status.PENDING, 'to': Document.Status.PREPROCESSING},
                ).save(user=self.user)

                from celery import chain as celery_chain
                from kombu import Connection
                from claimlens.tasks import preprocess_document, classify_document, extract_document

                doc_id = str(doc.id)
                user_id = str(self.user.id)
                pipeline = celery_chain(
                    preprocess_document.signature(
                        args=(doc_id, user_id), queue='claimlens.preprocessing'
                    ),
                    classify_document.signature(
                        args=(user_id,), queue='claimlens.classification'
                    ),
                    extract_document.signature(
                        args=(user_id,), queue='claimlens.extraction'
                    ),
                )
                broker_url = ClaimlensConfig.celery_broker_url
                if broker_url:
                    with Connection(broker_url) as conn:
                        result = pipeline.apply_async(connection=conn)
                else:
                    result = pipeline.apply_async()
                doc.celery_task_id = result.id
                doc.save(user=self.user)

                return output_result_success(dict_representation=model_representation(doc))
        except Exception as exc:
            return output_exception(model_name='Document', method='start_processing', exception=exc)

    @staticmethod
    def update_status(doc, status, user, error_message=None):
        old_status = doc.status
        doc.status = status
        if error_message:
            doc.error_message = error_message
        doc.save(user=user)

        AuditLog(
            document=doc,
            action=AuditLog.Action.STATUS_CHANGE,
            details={'from': old_status, 'to': status},
        ).save(user=user)


class DocumentTypeService(BaseService):
    OBJECT_TYPE = DocumentType

    def __init__(self, user, validation_class=DocumentTypeValidation):
        super().__init__(user, validation_class)

    @register_service_signal('claimlens.document_type.create')
    def create(self, obj_data):
        return super().create(obj_data)

    @register_service_signal('claimlens.document_type.update')
    def update(self, obj_data):
        return super().update(obj_data)

    @register_service_signal('claimlens.document_type.delete')
    def delete(self, obj_data):
        return super().delete(obj_data)


class EngineConfigService(BaseService):
    OBJECT_TYPE = EngineConfig

    def __init__(self, user, validation_class=EngineConfigValidation):
        super().__init__(user, validation_class)

    @register_service_signal('claimlens.engine_config.create')
    def create(self, obj_data):
        try:
            with transaction.atomic():
                api_key = obj_data.pop('api_key', None)
                if api_key:
                    obj_data['api_key_encrypted'] = self.encrypt_api_key(api_key)

                if obj_data.get('is_primary'):
                    EngineConfig.objects.filter(
                        is_primary=True, is_deleted=False
                    ).update(is_primary=False)

                self.validation_class.validate_create(self.user, **obj_data)
                obj = EngineConfig(**obj_data)
                return self.save_instance(obj)
        except Exception as exc:
            return output_exception(model_name='EngineConfig', method='create', exception=exc)

    @register_service_signal('claimlens.engine_config.update')
    def update(self, obj_data):
        try:
            with transaction.atomic():
                api_key = obj_data.pop('api_key', None)
                if api_key:
                    obj_data['api_key_encrypted'] = self.encrypt_api_key(api_key)

                if obj_data.get('is_primary'):
                    EngineConfig.objects.filter(
                        is_primary=True, is_deleted=False
                    ).exclude(id=obj_data.get('id')).update(is_primary=False)

                return super().update(obj_data)
        except Exception as exc:
            return output_exception(model_name='EngineConfig', method='update', exception=exc)

    @staticmethod
    def encrypt_api_key(api_key):
        return _get_fernet().encrypt(api_key.encode())

    @staticmethod
    def decrypt_api_key(encrypted_key):
        if isinstance(encrypted_key, memoryview):
            encrypted_key = bytes(encrypted_key)
        return _get_fernet().decrypt(encrypted_key).decode()


class EngineCapabilityScoreService(BaseService):
    OBJECT_TYPE = EngineCapabilityScore

    def __init__(self, user, validation_class=EngineCapabilityScoreValidation):
        super().__init__(user, validation_class)

    @register_service_signal('claimlens.capability_score.create')
    def create(self, obj_data):
        return super().create(obj_data)

    @register_service_signal('claimlens.capability_score.update')
    def update(self, obj_data):
        return super().update(obj_data)

    @staticmethod
    def record_extraction_result(engine_config, language, document_type,
                                 confidence, processing_time_ms, user):
        """Update capability scores using exponential moving average after extraction."""
        ALPHA = 0.2  # EMA smoothing factor — recent results have 20% weight

        score, created = EngineCapabilityScore.objects.get_or_create(
            engine_config=engine_config,
            language=language,
            document_type=document_type,
            defaults={
                'accuracy_score': 50, 'speed_score': 50, 'is_active': True,
                'user_created': user, 'user_updated': user,
            }
        )

        # Map confidence (0-1) to score (0-100)
        new_accuracy = int(confidence * 100)
        # Map processing_time_ms to speed score: <5s=100, >60s=0, linear between
        new_speed = max(0, min(100, int(100 - (processing_time_ms - 5000) / 550)))

        if created:
            score.accuracy_score = new_accuracy
            score.speed_score = new_speed
        else:
            score.accuracy_score = int(ALPHA * new_accuracy + (1 - ALPHA) * score.accuracy_score)
            score.speed_score = int(ALPHA * new_speed + (1 - ALPHA) * score.speed_score)

        score.save(user=user)
        logger.info(
            "Updated capability score for %s [%s]: accuracy=%d, speed=%d",
            engine_config.name, language, score.accuracy_score, score.speed_score,
        )


class RoutingPolicyService:
    """Handles singleton RoutingPolicy updates."""

    def __init__(self, user):
        self.user = user

    def update_or_create(self, data):
        try:
            with transaction.atomic():
                policy = RoutingPolicy.objects.first()
                if policy:
                    for key in ('accuracy_weight', 'cost_weight', 'speed_weight'):
                        if key in data:
                            setattr(policy, key, data[key])
                    policy.save(user=self.user)
                else:
                    policy = RoutingPolicy(
                        accuracy_weight=data.get('accuracy_weight', 0.50),
                        cost_weight=data.get('cost_weight', 0.30),
                        speed_weight=data.get('speed_weight', 0.20),
                    )
                    policy.save(user=self.user)
                return output_result_success(dict_representation=model_representation(policy))
        except Exception as exc:
            return output_exception(model_name='RoutingPolicy', method='update_or_create', exception=exc)


class ValidationRuleService(BaseService):
    OBJECT_TYPE = ValidationRule

    def __init__(self, user, validation_class=ValidationRuleValidation):
        super().__init__(user, validation_class)

    @register_service_signal('claimlens.validation_rule.create')
    def create(self, obj_data):
        return super().create(obj_data)

    @register_service_signal('claimlens.validation_rule.update')
    def update(self, obj_data):
        return super().update(obj_data)


class ModuleConfigService:
    """Handles updating module-level thresholds via ModuleConfiguration."""

    def __init__(self, user):
        self.user = user

    def update_thresholds(self, data):
        try:
            from core.models import ModuleConfiguration
            from claimlens.apps import DEFAULT_CFG

            import json as _json

            cfg, _created = ModuleConfiguration.objects.get_or_create(
                module='claimlens', layer='be',
                defaults={'config': _json.dumps(DEFAULT_CFG)},
            )
            config = cfg.config
            if isinstance(config, str):
                # ModuleConfiguration stores Python dict repr (single quotes)
                # Convert to valid JSON before parsing
                try:
                    config = _json.loads(config)
                except (_json.JSONDecodeError, ValueError):
                    config = _json.loads(config.replace("'", '"').replace('True', 'true').replace('False', 'false').replace('None', 'null'))
            config = config or {}

            if 'auto_approve_threshold' in data:
                config['auto_approve_threshold'] = data['auto_approve_threshold']
            if 'review_threshold' in data:
                config['review_threshold'] = data['review_threshold']

            cfg.config = _json.dumps(config)
            cfg.save()

            # Reload into ClaimlensConfig
            ClaimlensConfig.auto_approve_threshold = config.get('auto_approve_threshold', 0.90)
            ClaimlensConfig.review_threshold = config.get('review_threshold', 0.60)

            return output_result_success(dict_representation={
                'auto_approve_threshold': ClaimlensConfig.auto_approve_threshold,
                'review_threshold': ClaimlensConfig.review_threshold,
            })
        except Exception as exc:
            return output_exception(
                model_name='ModuleConfiguration', method='update_thresholds', exception=exc
            )


class RegistryUpdateProposalService:
    """Handles review and application of registry update proposals."""

    def __init__(self, user):
        self.user = user

    def review(self, proposal_uuid, status):
        """Set proposal status to approved or rejected."""
        try:
            with transaction.atomic():
                proposal = RegistryUpdateProposal.objects.get(
                    id=proposal_uuid, is_deleted=False
                )
                if proposal.status != RegistryUpdateProposal.Status.PROPOSED:
                    raise ValidationError(
                        f"Proposal must be in PROPOSED status, current: {proposal.status}"
                    )
                proposal.status = status
                proposal.reviewed_by = self.user
                proposal.reviewed_at = py_datetime.now()
                proposal.save(user=self.user)
                return output_result_success(dict_representation=model_representation(proposal))
        except Exception as exc:
            return output_exception(
                model_name='RegistryUpdateProposal', method='review', exception=exc
            )

    def apply(self, proposal_uuid):
        """Apply an approved proposal by writing to the target model via direct ORM."""
        try:
            with transaction.atomic():
                proposal = RegistryUpdateProposal.objects.get(
                    id=proposal_uuid, is_deleted=False
                )
                if proposal.status != RegistryUpdateProposal.Status.APPROVED:
                    raise ValidationError(
                        f"Proposal must be APPROVED to apply, current: {proposal.status}"
                    )

                if proposal.target_model == 'insuree':
                    from insuree.models import Insuree
                    target = Insuree.objects.get(uuid=proposal.target_uuid, validity_to__isnull=True)
                elif proposal.target_model == 'health_facility':
                    from location.models import HealthFacility
                    target = HealthFacility.objects.get(uuid=proposal.target_uuid, validity_to__isnull=True)
                else:
                    raise ValidationError(f"Unsupported target model: {proposal.target_model}")

                setattr(target, proposal.field_name, proposal.proposed_value)
                target.save(user=self.user)

                proposal.status = RegistryUpdateProposal.Status.APPLIED
                proposal.save(user=self.user)

                AuditLog(
                    document=proposal.document,
                    action=AuditLog.Action.REVIEW,
                    details={
                        'action': 'registry_update_applied',
                        'target_model': proposal.target_model,
                        'target_uuid': str(proposal.target_uuid),
                        'field': proposal.field_name,
                        'old_value': proposal.current_value,
                        'new_value': proposal.proposed_value,
                    },
                ).save(user=self.user)

                return output_result_success(dict_representation=model_representation(proposal))
        except Exception as exc:
            return output_exception(
                model_name='RegistryUpdateProposal', method='apply', exception=exc
            )


class EngineRoutingRuleService(BaseService):
    OBJECT_TYPE = EngineRoutingRule

    def __init__(self, user, validation_class=EngineRoutingRuleValidation):
        super().__init__(user, validation_class)

    @register_service_signal('claimlens.routing_rule.create')
    def create(self, obj_data):
        return super().create(obj_data)

    @register_service_signal('claimlens.routing_rule.update')
    def update(self, obj_data):
        return super().update(obj_data)
