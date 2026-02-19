from django.core.exceptions import ValidationError

from core.validation import BaseModelValidation
from claimlens.apps import ClaimlensConfig
from claimlens.models import (
    Document, DocumentType, EngineConfig,
    EngineCapabilityScore, ValidationRule, RegistryUpdateProposal,
    EngineRoutingRule,
)


class DocumentValidation(BaseModelValidation):
    OBJECT_TYPE = Document

    @classmethod
    def validate_create(cls, user, **data):
        super().validate_create(user, **data)
        cls.validate_upload(user, **data)

    @classmethod
    def validate_upload(cls, user, **data):
        mime_type = data.get('mime_type')
        file_size = data.get('file_size')
        storage_key = data.get('storage_key')

        allowed = ClaimlensConfig.allowed_mime_types
        if mime_type and allowed and mime_type not in allowed:
            raise ValidationError(
                f"Unsupported file type: {mime_type}. Allowed: {', '.join(allowed)}"
            )

        max_bytes = (ClaimlensConfig.max_file_size_mb or 20) * 1024 * 1024
        if file_size and file_size > max_bytes:
            raise ValidationError(
                f"File size {file_size} exceeds maximum of {ClaimlensConfig.max_file_size_mb} MB"
            )

        if not storage_key:
            raise ValidationError("storage_key is required")

    @classmethod
    def validate_process(cls, user, document):
        if document.status != Document.Status.PENDING:
            raise ValidationError(
                f"Document must be in PENDING status to process, current: {document.status}"
            )


class DocumentTypeValidation(BaseModelValidation):
    OBJECT_TYPE = DocumentType

    @classmethod
    def validate_create(cls, user, **data):
        super().validate_create(user, **data)
        code = data.get('code')
        if code and DocumentType.objects.filter(code=code, is_deleted=False).exists():
            raise ValidationError(f"DocumentType with code '{code}' already exists")

    @classmethod
    def validate_update(cls, user, **data):
        super().validate_update(user, **data)
        code = data.get('code')
        obj_id = data.get('id')
        if code and DocumentType.objects.filter(
            code=code, is_deleted=False
        ).exclude(id=obj_id).exists():
            raise ValidationError(f"DocumentType with code '{code}' already exists")


class EngineConfigValidation(BaseModelValidation):
    OBJECT_TYPE = EngineConfig

    @classmethod
    def validate_create(cls, user, **data):
        super().validate_create(user, **data)
        adapter = data.get('adapter')
        valid_adapters = [c[0] for c in EngineConfig.Adapter.choices]
        if adapter and adapter not in valid_adapters:
            raise ValidationError(
                f"Invalid adapter: {adapter}. Valid: {', '.join(valid_adapters)}"
            )

    @classmethod
    def validate_update(cls, user, **data):
        super().validate_update(user, **data)
        cls.validate_create(user, **data)


class EngineCapabilityScoreValidation(BaseModelValidation):
    OBJECT_TYPE = EngineCapabilityScore

    @classmethod
    def validate_create(cls, user, **data):
        super().validate_create(user, **data)
        for field in ('accuracy_score', 'speed_score'):
            val = data.get(field)
            if val is not None and (val < 0 or val > 100):
                raise ValidationError(f"{field} must be between 0 and 100")

    @classmethod
    def validate_update(cls, user, **data):
        super().validate_update(user, **data)
        cls.validate_create(user, **data)


class ValidationRuleValidation(BaseModelValidation):
    OBJECT_TYPE = ValidationRule

    @classmethod
    def validate_create(cls, user, **data):
        super().validate_create(user, **data)
        code = data.get('code')
        if code and ValidationRule.objects.filter(code=code, is_deleted=False).exists():
            raise ValidationError(f"ValidationRule with code '{code}' already exists")

    @classmethod
    def validate_update(cls, user, **data):
        super().validate_update(user, **data)
        code = data.get('code')
        obj_id = data.get('id')
        if code and ValidationRule.objects.filter(
            code=code, is_deleted=False
        ).exclude(id=obj_id).exists():
            raise ValidationError(f"ValidationRule with code '{code}' already exists")


class RegistryUpdateProposalValidation(BaseModelValidation):
    OBJECT_TYPE = RegistryUpdateProposal

    @classmethod
    def validate_update(cls, user, **data):
        super().validate_update(user, **data)
        status = data.get('status')
        if status:
            valid = [c[0] for c in RegistryUpdateProposal.Status.choices]
            if status not in valid:
                raise ValidationError(
                    f"Invalid status: {status}. Valid: {', '.join(valid)}"
                )


class EngineRoutingRuleValidation(BaseModelValidation):
    OBJECT_TYPE = EngineRoutingRule

    @classmethod
    def validate_create(cls, user, **data):
        super().validate_create(user, **data)
        priority = data.get('priority')
        if priority is not None and (priority < 0 or priority > 100):
            raise ValidationError("priority must be between 0 and 100")
        min_conf = data.get('min_confidence')
        if min_conf is not None and (min_conf < 0.0 or min_conf > 1.0):
            raise ValidationError("min_confidence must be between 0.0 and 1.0")

    @classmethod
    def validate_update(cls, user, **data):
        super().validate_update(user, **data)
        cls.validate_create(user, **data)
