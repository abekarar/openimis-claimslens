import graphene
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils.translation import gettext as _

from core.schema import OpenIMISMutation
from claimlens.apps import ClaimlensConfig
from claimlens.models import Document, DocumentType, EngineConfig, DocumentMutation
from claimlens.services import DocumentService, DocumentTypeService, EngineConfigService


class ProcessDocumentInput(OpenIMISMutation.Input):
    uuid = graphene.UUID(required=True)


class CreateDocumentTypeInput(OpenIMISMutation.Input):
    code = graphene.String(required=True)
    name = graphene.String(required=True)
    extraction_template = graphene.JSONString(required=False)
    field_definitions = graphene.JSONString(required=False)
    classification_hints = graphene.String(required=False)
    is_active = graphene.Boolean(required=False)


class UpdateDocumentTypeInput(CreateDocumentTypeInput):
    id = graphene.UUID(required=True)


class CreateEngineConfigInput(OpenIMISMutation.Input):
    name = graphene.String(required=True)
    adapter = graphene.String(required=True)
    endpoint_url = graphene.String(required=True)
    api_key = graphene.String(required=False)
    model_name = graphene.String(required=True)
    deployment_mode = graphene.String(required=False)
    is_primary = graphene.Boolean(required=False)
    is_fallback = graphene.Boolean(required=False)
    is_active = graphene.Boolean(required=False)
    max_tokens = graphene.Int(required=False)
    temperature = graphene.Float(required=False)
    timeout_seconds = graphene.Int(required=False)


class UpdateEngineConfigInput(CreateEngineConfigInput):
    id = graphene.UUID(required=True)


class ProcessDocumentMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "ProcessDocumentMutation"

    class Input(ProcessDocumentInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_process_document_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = DocumentService(user)
            result = service.start_processing(data['uuid'])
            if not result.get('success'):
                return [{"message": result.get('detail', 'Processing failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class CreateDocumentTypeMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "CreateDocumentTypeMutation"

    class Input(CreateDocumentTypeInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_document_types_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = DocumentTypeService(user)
            result = service.create(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Create failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateDocumentTypeMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateDocumentTypeMutation"

    class Input(UpdateDocumentTypeInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_document_types_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = DocumentTypeService(user)
            result = service.update(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class CreateEngineConfigMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "CreateEngineConfigMutation"

    class Input(CreateEngineConfigInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_engine_configs_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = EngineConfigService(user)
            result = service.create(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Create failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateEngineConfigMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateEngineConfigMutation"

    class Input(UpdateEngineConfigInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_engine_configs_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = EngineConfigService(user)
            result = service.update(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]
