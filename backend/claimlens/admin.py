from django.contrib import admin

from claimlens.models import (
    DocumentType, EngineConfig, Document, ExtractionResult, AuditLog
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
    list_display = ('original_filename', 'status', 'mime_type', 'file_size', 'date_created')
    search_fields = ('original_filename', 'storage_key')
    list_filter = ('status', 'mime_type')


class ExtractionResultAdmin(admin.ModelAdmin):
    list_display = ('document', 'aggregate_confidence', 'processing_time_ms', 'tokens_used')


class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('document', 'action', 'date_created')
    list_filter = ('action',)


admin.site.register(DocumentType, DocumentTypeAdmin)
admin.site.register(EngineConfig, EngineConfigAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(ExtractionResult, ExtractionResultAdmin)
admin.site.register(AuditLog, AuditLogAdmin)
