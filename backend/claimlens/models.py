from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import HistoryModel, UUIDModel, ObjectMutation, MutationLog
import core.models as core_models


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
        OPENAI_COMPATIBLE = 'openai_compatible', _('OpenAI Compatible')
        MISTRAL = 'mistral', _('Mistral (legacy)')
        DEEPSEEK = 'deepseek', _('DeepSeek (legacy)')

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
    language = models.CharField(max_length=10, null=True, blank=True,
                                help_text="ISO 639-1 language code detected during classification")
    claim_uuid = models.UUIDField(null=True, blank=True,
                                  help_text="UUID of linked openIMIS Claim (plain UUID, not FK)")

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


class EngineCapabilityScore(HistoryModel):
    engine_config = models.ForeignKey(
        EngineConfig, on_delete=models.DO_NOTHING, related_name='capability_scores'
    )
    language = models.CharField(max_length=10, help_text="ISO 639-1 language code")
    document_type = models.ForeignKey(
        DocumentType, on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name='capability_scores'
    )
    accuracy_score = models.IntegerField(
        default=50, help_text="Accuracy score 0-100"
    )
    cost_per_page = models.DecimalField(
        max_digits=10, decimal_places=4, default=0,
        help_text="Cost per page in USD"
    )
    speed_score = models.IntegerField(
        default=50, help_text="Speed score 0-100"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('engine_config', 'language', 'document_type')

    def __str__(self):
        dt = self.document_type.code if self.document_type else '*'
        return f"{self.engine_config.name} [{self.language}/{dt}] acc={self.accuracy_score}"


class RoutingPolicy(HistoryModel):
    accuracy_weight = models.FloatField(default=0.50)
    cost_weight = models.FloatField(default=0.30)
    speed_weight = models.FloatField(default=0.20)

    def save(self, **kwargs):
        # Singleton: always use pk=1
        self.pk = self.__class__.objects.first().pk if self.__class__.objects.exists() else None
        super().save(**kwargs)

    def __str__(self):
        return f"RoutingPolicy(acc={self.accuracy_weight}, cost={self.cost_weight}, speed={self.speed_weight})"

    class Meta:
        verbose_name_plural = "Routing policies"


class ValidationResult(HistoryModel):
    class ValidationType(models.TextChoices):
        UPSTREAM = 'upstream', _('Upstream')
        DOWNSTREAM = 'downstream', _('Downstream')

    class OverallStatus(models.TextChoices):
        MATCHED = 'matched', _('Matched')
        MISMATCHED = 'mismatched', _('Mismatched')
        PARTIAL_MATCH = 'partial_match', _('Partial Match')
        PENDING = 'pending', _('Pending')
        ERROR = 'error', _('Error')

    document = models.ForeignKey(
        Document, on_delete=models.DO_NOTHING, related_name='validation_results'
    )
    validation_type = models.CharField(max_length=20, choices=ValidationType.choices)
    overall_status = models.CharField(
        max_length=20, choices=OverallStatus.choices, default=OverallStatus.PENDING
    )
    field_comparisons = models.JSONField(default=dict, blank=True)
    discrepancy_count = models.IntegerField(default=0)
    match_score = models.FloatField(default=0.0)
    summary = models.TextField(blank=True, default="")
    validated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.validation_type} validation for {self.document} — {self.overall_status}"


class ValidationRule(HistoryModel):
    class RuleType(models.TextChoices):
        ELIGIBILITY = 'eligibility', _('Eligibility')
        CLINICAL = 'clinical', _('Clinical')
        FRAUD = 'fraud', _('Fraud')
        REGISTRY = 'registry', _('Registry')

    class Severity(models.TextChoices):
        INFO = 'info', _('Info')
        WARNING = 'warning', _('Warning')
        ERROR = 'error', _('Error')

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    rule_type = models.CharField(max_length=20, choices=RuleType.choices)
    rule_definition = models.JSONField(default=dict, blank=True)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.WARNING)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} — {self.name} ({self.rule_type})"


class ValidationFinding(HistoryModel):
    class FindingType(models.TextChoices):
        VIOLATION = 'violation', _('Violation')
        WARNING = 'warning', _('Warning')
        UPDATE_PROPOSAL = 'update_proposal', _('Update Proposal')

    class ResolutionStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        ACCEPTED = 'accepted', _('Accepted')
        REJECTED = 'rejected', _('Rejected')
        DEFERRED = 'deferred', _('Deferred')

    validation_result = models.ForeignKey(
        ValidationResult, on_delete=models.DO_NOTHING, related_name='findings'
    )
    validation_rule = models.ForeignKey(
        ValidationRule, on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name='findings'
    )
    finding_type = models.CharField(max_length=20, choices=FindingType.choices)
    severity = models.CharField(
        max_length=10, choices=ValidationRule.Severity.choices, default=ValidationRule.Severity.WARNING
    )
    field = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    details = models.JSONField(default=dict, blank=True)
    resolution_status = models.CharField(
        max_length=20, choices=ResolutionStatus.choices, default=ResolutionStatus.PENDING
    )

    def __str__(self):
        return f"{self.finding_type} [{self.severity}] {self.field}: {self.description[:50]}"


class RegistryUpdateProposal(HistoryModel):
    class Status(models.TextChoices):
        PROPOSED = 'proposed', _('Proposed')
        APPROVED = 'approved', _('Approved')
        APPLIED = 'applied', _('Applied')
        REJECTED = 'rejected', _('Rejected')

    document = models.ForeignKey(
        Document, on_delete=models.DO_NOTHING, related_name='registry_proposals'
    )
    validation_result = models.ForeignKey(
        ValidationResult, on_delete=models.DO_NOTHING, related_name='registry_proposals'
    )
    target_model = models.CharField(max_length=50, help_text="e.g. insuree, health_facility")
    target_uuid = models.UUIDField()
    field_name = models.CharField(max_length=255)
    current_value = models.TextField(blank=True, default="")
    proposed_value = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PROPOSED
    )
    reviewed_by = models.ForeignKey(
        core_models.User, on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name='claimlens_proposal_reviews'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Proposal: {self.target_model}.{self.field_name} → {self.proposed_value[:30]}"
