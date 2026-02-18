from django.contrib import admin

from claimlens.models import (
    DocumentType, EngineConfig, Document, ExtractionResult, AuditLog,
    EngineCapabilityScore, RoutingPolicy, ValidationResult, ValidationRule,
    ValidationFinding, RegistryUpdateProposal,
)


class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'date_created')
    search_fields = ('code', 'name')
    list_filter = ('is_active',)


class EngineConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'adapter', 'model_name', 'is_primary', 'is_fallback', 'is_active')
    search_fields = ('name', 'model_name')
    list_filter = ('adapter', 'is_primary', 'is_fallback', 'is_active')


class DocumentAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'status', 'mime_type', 'file_size', 'language', 'date_created')
    search_fields = ('original_filename', 'storage_key')
    list_filter = ('status', 'mime_type', 'language')


class ExtractionResultAdmin(admin.ModelAdmin):
    list_display = ('document', 'aggregate_confidence', 'processing_time_ms', 'tokens_used')


class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('document', 'action', 'date_created')
    list_filter = ('action',)


class EngineCapabilityScoreAdmin(admin.ModelAdmin):
    list_display = ('engine_config', 'language', 'document_type', 'accuracy_score', 'speed_score', 'is_active')
    list_filter = ('language', 'is_active')
    search_fields = ('engine_config__name',)


class RoutingPolicyAdmin(admin.ModelAdmin):
    list_display = ('accuracy_weight', 'cost_weight', 'speed_weight')


class ValidationResultAdmin(admin.ModelAdmin):
    list_display = ('document', 'validation_type', 'overall_status', 'match_score', 'discrepancy_count', 'validated_at')
    list_filter = ('validation_type', 'overall_status')


class ValidationRuleAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'rule_type', 'severity', 'is_active')
    list_filter = ('rule_type', 'severity', 'is_active')
    search_fields = ('code', 'name')


class ValidationFindingAdmin(admin.ModelAdmin):
    list_display = ('validation_result', 'finding_type', 'severity', 'field', 'resolution_status')
    list_filter = ('finding_type', 'severity', 'resolution_status')


class RegistryUpdateProposalAdmin(admin.ModelAdmin):
    list_display = ('document', 'target_model', 'field_name', 'status', 'reviewed_by')
    list_filter = ('target_model', 'status')


admin.site.register(DocumentType, DocumentTypeAdmin)
admin.site.register(EngineConfig, EngineConfigAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(ExtractionResult, ExtractionResultAdmin)
admin.site.register(AuditLog, AuditLogAdmin)
admin.site.register(EngineCapabilityScore, EngineCapabilityScoreAdmin)
admin.site.register(RoutingPolicy, RoutingPolicyAdmin)
admin.site.register(ValidationResult, ValidationResultAdmin)
admin.site.register(ValidationRule, ValidationRuleAdmin)
admin.site.register(ValidationFinding, ValidationFindingAdmin)
admin.site.register(RegistryUpdateProposal, RegistryUpdateProposalAdmin)
