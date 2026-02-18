import graphene
from graphene_django import DjangoObjectType

from core import ExtendedConnection
from claimlens.apps import ClaimlensConfig
from claimlens.models import Document, DocumentType, EngineConfig, ExtractionResult, AuditLog


class DocumentTypeGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = DocumentType
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "code": ["exact", "iexact", "icontains"],
            "name": ["exact", "iexact", "icontains"],
            "is_active": ["exact"],
            "date_created": ["exact", "lt", "lte", "gt", "gte"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection


class EngineConfigGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = EngineConfig
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "name": ["exact", "iexact", "icontains"],
            "adapter": ["exact"],
            "is_primary": ["exact"],
            "is_fallback": ["exact"],
            "is_active": ["exact"],
            "deployment_mode": ["exact"],
            "date_created": ["exact", "lt", "lte", "gt", "gte"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection
        exclude = ('api_key_encrypted',)


class ExtractionResultGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = ExtractionResult
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "aggregate_confidence": ["exact", "lt", "lte", "gt", "gte"],
            "date_created": ["exact", "lt", "lte", "gt", "gte"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection


class DocumentGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')
    extraction_result = graphene.Field(ExtractionResultGQLType)

    class Meta:
        model = Document
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "original_filename": ["exact", "icontains"],
            "mime_type": ["exact"],
            "status": ["exact", "iexact"],
            "date_created": ["exact", "lt", "lte", "gt", "gte"],
            "date_updated": ["exact", "lt", "lte", "gt", "gte"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection

    def resolve_extraction_result(self, info):
        try:
            return self.extraction_result
        except ExtractionResult.DoesNotExist:
            return None

    @classmethod
    def get_queryset(cls, queryset, info):
        return queryset.filter(is_deleted=False)


class AuditLogGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = AuditLog
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "action": ["exact"],
            "date_created": ["exact", "lt", "lte", "gt", "gte"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection
