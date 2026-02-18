import graphene
import graphene_django_optimizer as gql_optimizer

from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import PermissionDenied
from django.db.models import Q

from core.schema import OrderedDjangoFilterConnectionField
from claimlens.apps import ClaimlensConfig
from claimlens.gql_queries import (
    DocumentGQLType, DocumentTypeGQLType, EngineConfigGQLType,
    ExtractionResultGQLType, AuditLogGQLType,
    EngineCapabilityScoreGQLType, RoutingPolicyGQLType,
    ValidationResultGQLType, ValidationRuleGQLType,
    ValidationFindingGQLType, RegistryUpdateProposalGQLType,
)
from claimlens.gql_mutations import (
    ProcessDocumentMutation, CreateDocumentTypeMutation,
    UpdateDocumentTypeMutation, CreateEngineConfigMutation,
    UpdateEngineConfigMutation,
    CreateCapabilityScoreMutation, UpdateCapabilityScoreMutation,
    UpdateRoutingPolicyMutation,
    CreateValidationRuleMutation, UpdateValidationRuleMutation,
    RunValidationMutation,
    ReviewRegistryProposalMutation, ApplyRegistryProposalMutation,
    ResolveValidationFindingMutation,
)
from claimlens.models import (
    Document, DocumentType, EngineConfig, ExtractionResult, AuditLog,
    EngineCapabilityScore, RoutingPolicy, ValidationResult, ValidationRule,
    ValidationFinding, RegistryUpdateProposal,
)


class Query(graphene.ObjectType):
    module_name = "claimlens"

    claimlens_documents = OrderedDjangoFilterConnectionField(
        DocumentGQLType,
        orderBy=graphene.List(of_type=graphene.String),
    )
    claimlens_document = graphene.Field(
        DocumentGQLType,
        uuid=graphene.UUID(required=True),
    )
    claimlens_extraction_result = graphene.Field(
        ExtractionResultGQLType,
        document_uuid=graphene.UUID(required=True),
    )
    claimlens_document_types = OrderedDjangoFilterConnectionField(
        DocumentTypeGQLType,
        orderBy=graphene.List(of_type=graphene.String),
    )
    claimlens_engine_configs = OrderedDjangoFilterConnectionField(
        EngineConfigGQLType,
        orderBy=graphene.List(of_type=graphene.String),
    )
    claimlens_audit_logs = OrderedDjangoFilterConnectionField(
        AuditLogGQLType,
        orderBy=graphene.List(of_type=graphene.String),
        document_uuid=graphene.UUID(),
    )
    claimlens_capability_scores = OrderedDjangoFilterConnectionField(
        EngineCapabilityScoreGQLType,
        orderBy=graphene.List(of_type=graphene.String),
    )
    claimlens_routing_policy = graphene.Field(RoutingPolicyGQLType)
    claimlens_validation_results = OrderedDjangoFilterConnectionField(
        ValidationResultGQLType,
        orderBy=graphene.List(of_type=graphene.String),
        document_uuid=graphene.UUID(),
    )
    claimlens_validation_result = graphene.Field(
        ValidationResultGQLType,
        uuid=graphene.UUID(required=True),
    )
    claimlens_validation_rules = OrderedDjangoFilterConnectionField(
        ValidationRuleGQLType,
        orderBy=graphene.List(of_type=graphene.String),
    )
    claimlens_validation_rule = graphene.Field(
        ValidationRuleGQLType,
        uuid=graphene.UUID(required=True),
    )
    claimlens_validation_findings = OrderedDjangoFilterConnectionField(
        ValidationFindingGQLType,
        orderBy=graphene.List(of_type=graphene.String),
        validation_result_uuid=graphene.UUID(),
    )
    claimlens_registry_proposals = OrderedDjangoFilterConnectionField(
        RegistryUpdateProposalGQLType,
        orderBy=graphene.List(of_type=graphene.String),
        document_uuid=graphene.UUID(),
    )

    # --- Existing resolvers ---

    def resolve_claimlens_documents(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_documents_perms)
        query = Document.objects.filter(is_deleted=False)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_document(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_documents_perms)
        uuid = kwargs.get('uuid')
        return Document.objects.filter(id=uuid, is_deleted=False).first()

    def resolve_claimlens_extraction_result(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_extraction_results_perms)
        doc_uuid = kwargs.get('document_uuid')
        return ExtractionResult.objects.filter(
            document__id=doc_uuid, is_deleted=False
        ).first()

    def resolve_claimlens_document_types(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_document_types_perms)
        query = DocumentType.objects.filter(is_deleted=False)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_engine_configs(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_engine_configs_perms)
        query = EngineConfig.objects.filter(is_deleted=False)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_audit_logs(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_documents_perms)
        filters = [Q(is_deleted=False)]
        doc_uuid = kwargs.get('document_uuid')
        if doc_uuid:
            filters.append(Q(document__id=doc_uuid))
        query = AuditLog.objects.filter(*filters)
        return gql_optimizer.query(query, info)

    # --- New resolvers ---

    def resolve_claimlens_capability_scores(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_capability_scores_perms)
        query = EngineCapabilityScore.objects.filter(is_deleted=False)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_routing_policy(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_routing_policy_perms)
        return RoutingPolicy.objects.first()

    def resolve_claimlens_validation_results(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_validation_results_perms)
        filters = [Q(is_deleted=False)]
        doc_uuid = kwargs.get('document_uuid')
        if doc_uuid:
            filters.append(Q(document__id=doc_uuid))
        query = ValidationResult.objects.filter(*filters)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_validation_result(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_validation_results_perms)
        uuid = kwargs.get('uuid')
        return ValidationResult.objects.filter(id=uuid, is_deleted=False).first()

    def resolve_claimlens_validation_rules(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_validation_rules_perms)
        query = ValidationRule.objects.filter(is_deleted=False)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_validation_rule(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_validation_rules_perms)
        uuid = kwargs.get('uuid')
        return ValidationRule.objects.filter(id=uuid, is_deleted=False).first()

    def resolve_claimlens_validation_findings(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_validation_results_perms)
        filters = [Q(is_deleted=False)]
        vr_uuid = kwargs.get('validation_result_uuid')
        if vr_uuid:
            filters.append(Q(validation_result__id=vr_uuid))
        query = ValidationFinding.objects.filter(*filters)
        return gql_optimizer.query(query, info)

    def resolve_claimlens_registry_proposals(self, info, **kwargs):
        _check_permissions(info.context.user, ClaimlensConfig.gql_query_registry_proposals_perms)
        filters = [Q(is_deleted=False)]
        doc_uuid = kwargs.get('document_uuid')
        if doc_uuid:
            filters.append(Q(document__id=doc_uuid))
        query = RegistryUpdateProposal.objects.filter(*filters)
        return gql_optimizer.query(query, info)


class Mutation(graphene.ObjectType):
    process_claimlens_document = ProcessDocumentMutation.Field()
    create_claimlens_document_type = CreateDocumentTypeMutation.Field()
    update_claimlens_document_type = UpdateDocumentTypeMutation.Field()
    create_claimlens_engine_config = CreateEngineConfigMutation.Field()
    update_claimlens_engine_config = UpdateEngineConfigMutation.Field()
    create_claimlens_capability_score = CreateCapabilityScoreMutation.Field()
    update_claimlens_capability_score = UpdateCapabilityScoreMutation.Field()
    update_claimlens_routing_policy = UpdateRoutingPolicyMutation.Field()
    create_claimlens_validation_rule = CreateValidationRuleMutation.Field()
    update_claimlens_validation_rule = UpdateValidationRuleMutation.Field()
    run_claimlens_validation = RunValidationMutation.Field()
    review_claimlens_registry_proposal = ReviewRegistryProposalMutation.Field()
    apply_claimlens_registry_proposal = ApplyRegistryProposalMutation.Field()
    resolve_claimlens_validation_finding = ResolveValidationFindingMutation.Field()


def _check_permissions(user, perms):
    if type(user) is AnonymousUser or not user.id or not user.has_perms(perms):
        raise PermissionDenied("Unauthorized")
