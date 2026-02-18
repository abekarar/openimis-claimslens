from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import HistoryModel, UUIDModel, ObjectMutation, MutationLog


class DocumentType(HistoryModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    extraction_template = models.JSONField(default=dict, blank=True)
    field_definitions = models.JSONField(default=dict, blank=True)
    classification_hints = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class EngineConfig(HistoryModel):
    class Adapter(models.TextChoices):
        MISTRAL = 'mistral', _('Mistral')
        GEMINI = 'gemini', _('Gemini')
        DEEPSEEK = 'deepseek', _('DeepSeek')

    class DeploymentMode(models.TextChoices):
        CLOUD = 'cloud', _('Cloud')
        SELF_HOSTED = 'self_hosted', _('Self Hosted')

    name = models.CharField(max_length=255)
    adapter = models.CharField(max_length=50, choices=Adapter.choices)
    endpoint_url = models.URLField(max_length=500)
    api_key_encrypted = models.BinaryField(null=True, blank=True)
    model_name = models.CharField(max_length=255)
    deployment_mode = models.CharField(
        max_length=20, choices=DeploymentMode.choices, default=DeploymentMode.CLOUD
    )
    is_primary = models.BooleanField(default=False)
    is_fallback = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    max_tokens = models.IntegerField(default=4096)
    temperature = models.FloatField(default=0.1)
    timeout_seconds = models.IntegerField(default=120)

    def __str__(self):
        return f"{self.name} ({self.adapter})"


class Document(HistoryModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PREPROCESSING = 'preprocessing', _('Preprocessing')
        CLASSIFYING = 'classifying', _('Classifying')
        EXTRACTING = 'extracting', _('Extracting')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        REVIEW_REQUIRED = 'review_required', _('Review Required')

    original_filename = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField()
    storage_key = models.CharField(max_length=1000, unique=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    error_message = models.TextField(blank=True, null=True)
    celery_task_id = models.CharField(max_length=255, blank=True, null=True)
    document_type = models.ForeignKey(
        DocumentType, on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name='documents'
    )
    classification_confidence = models.FloatField(null=True, blank=True)
    preprocessing_metadata = models.JSONField(default=dict, blank=True)
    engine_config = models.ForeignKey(
        EngineConfig, on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name='documents'
    )

    def __str__(self):
        return f"{self.original_filename} ({self.status})"


class ExtractionResult(HistoryModel):
    document = models.OneToOneField(
        Document, on_delete=models.DO_NOTHING, related_name='extraction_result'
    )
    structured_data = models.JSONField(default=dict)
    field_confidences = models.JSONField(default=dict)
    aggregate_confidence = models.FloatField(default=0.0)
    raw_llm_response = models.JSONField(default=dict, blank=True)
    processing_time_ms = models.IntegerField(default=0)
    tokens_used = models.IntegerField(default=0)

    def __str__(self):
        return f"Extraction for {self.document.original_filename}"


class AuditLog(HistoryModel):
    class Action(models.TextChoices):
        UPLOAD = 'upload', _('Upload')
        PREPROCESS = 'preprocess', _('Preprocess')
        CLASSIFY = 'classify', _('Classify')
        EXTRACT = 'extract', _('Extract')
        STATUS_CHANGE = 'status_change', _('Status Change')
        REVIEW = 'review', _('Review')
        ERROR = 'error', _('Error')

    document = models.ForeignKey(
        Document, on_delete=models.DO_NOTHING, related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    details = models.JSONField(default=dict, blank=True)
    engine_config = models.ForeignKey(
        EngineConfig, on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name='audit_logs'
    )

    def __str__(self):
        return f"{self.action} on {self.document.original_filename}"

    class Meta:
        ordering = ['-date_created']


class DocumentMutation(UUIDModel, ObjectMutation):
    document = models.ForeignKey(
        Document, models.DO_NOTHING, related_name='mutations'
    )
    mutation = models.ForeignKey(
        MutationLog, models.DO_NOTHING, related_name='claimlens_documents'
    )
