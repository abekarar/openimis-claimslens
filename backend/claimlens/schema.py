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
)
from claimlens.gql_mutations import (
    ProcessDocumentMutation, CreateDocumentTypeMutation,
    UpdateDocumentTypeMutation, CreateEngineConfigMutation,
    UpdateEngineConfigMutation,
)
from claimlens.models import Document, DocumentType, EngineConfig, ExtractionResult, AuditLog


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


class Mutation(graphene.ObjectType):
    process_claimlens_document = ProcessDocumentMutation.Field()
    create_claimlens_document_type = CreateDocumentTypeMutation.Field()
    update_claimlens_document_type = UpdateDocumentTypeMutation.Field()
    create_claimlens_engine_config = CreateEngineConfigMutation.Field()
    update_claimlens_engine_config = UpdateEngineConfigMutation.Field()


def _check_permissions(user, perms):
    if type(user) is AnonymousUser or not user.id or not user.has_perms(perms):
        raise PermissionDenied("Unauthorized")
