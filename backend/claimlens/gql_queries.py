import graphene
from graphene_django import DjangoObjectType

from core import ExtendedConnection
from claimlens.apps import ClaimlensConfig
from claimlens.models import (
    Document, DocumentType, EngineConfig, ExtractionResult, AuditLog,
    EngineCapabilityScore, RoutingPolicy, ValidationResult, ValidationRule,
    ValidationFinding, RegistryUpdateProposal, EngineRoutingRule,
)


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


class ValidationFindingGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = ValidationFinding
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "finding_type": ["exact"],
            "severity": ["exact"],
            "resolution_status": ["exact"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection


class RegistryUpdateProposalGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = RegistryUpdateProposal
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "target_model": ["exact"],
            "status": ["exact"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection


class ValidationResultGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')
    findings = graphene.List(ValidationFindingGQLType)
    registry_proposals = graphene.List(RegistryUpdateProposalGQLType)

    class Meta:
        model = ValidationResult
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "validation_type": ["exact"],
            "overall_status": ["exact"],
            "date_created": ["exact", "lt", "lte", "gt", "gte"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection

    def resolve_findings(self, info):
        return self.findings.filter(is_deleted=False)

    def resolve_registry_proposals(self, info):
        return self.registry_proposals.filter(is_deleted=False)


class DocumentGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')
    extraction_result = graphene.Field(ExtractionResultGQLType)
    validation_results = graphene.List(ValidationResultGQLType)

    class Meta:
        model = Document
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "original_filename": ["exact", "icontains"],
            "mime_type": ["exact"],
            "status": ["exact", "iexact"],
            "language": ["exact"],
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

    def resolve_validation_results(self, info):
        return self.validation_results.filter(is_deleted=False)

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


class EngineCapabilityScoreGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = EngineCapabilityScore
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "language": ["exact"],
            "is_active": ["exact"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection


class RoutingPolicyGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = RoutingPolicy
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
        }
        connection_class = ExtendedConnection


class ValidationRuleGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = ValidationRule
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "code": ["exact", "icontains"],
            "rule_type": ["exact"],
            "severity": ["exact"],
            "is_active": ["exact"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection


class EngineRoutingRuleGQLType(DjangoObjectType):
    uuid = graphene.String(source='uuid')

    class Meta:
        model = EngineRoutingRule
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "id": ["exact"],
            "language": ["exact"],
            "priority": ["exact", "lt", "lte", "gt", "gte"],
            "is_active": ["exact"],
            "is_deleted": ["exact"],
        }
        connection_class = ExtendedConnection
