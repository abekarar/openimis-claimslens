import graphene
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils.translation import gettext as _

from core.schema import OpenIMISMutation
from claimlens.apps import ClaimlensConfig
from claimlens.models import (
    Document, DocumentType, EngineConfig, DocumentMutation,
    EngineCapabilityScore, ValidationRule, ValidationFinding, RegistryUpdateProposal,
    EngineRoutingRule, AuditLog, ExtractionResult,
)
from claimlens.services import (
    DocumentService, DocumentTypeService, EngineConfigService,
    EngineCapabilityScoreService, RoutingPolicyService,
    ValidationRuleService, RegistryUpdateProposalService,
    ModuleConfigService, EngineRoutingRuleService,
    PromptTemplateService,
)


# --- Input types ---

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


class CreateCapabilityScoreInput(OpenIMISMutation.Input):
    engine_config_id = graphene.UUID(required=True)
    language = graphene.String(required=True)
    document_type_id = graphene.UUID(required=False)
    accuracy_score = graphene.Int(required=False)
    cost_per_page = graphene.Decimal(required=False)
    speed_score = graphene.Int(required=False)
    is_active = graphene.Boolean(required=False)


class UpdateCapabilityScoreInput(CreateCapabilityScoreInput):
    id = graphene.UUID(required=True)


class UpdateRoutingPolicyInput(OpenIMISMutation.Input):
    accuracy_weight = graphene.Float(required=False)
    cost_weight = graphene.Float(required=False)
    speed_weight = graphene.Float(required=False)


class CreateValidationRuleInput(OpenIMISMutation.Input):
    code = graphene.String(required=True)
    name = graphene.String(required=True)
    rule_type = graphene.String(required=True)
    rule_definition = graphene.JSONString(required=False)
    severity = graphene.String(required=False)
    is_active = graphene.Boolean(required=False)


class UpdateValidationRuleInput(CreateValidationRuleInput):
    id = graphene.UUID(required=True)


class RunValidationInput(OpenIMISMutation.Input):
    document_uuid = graphene.UUID(required=True)


class ReviewRegistryProposalInput(OpenIMISMutation.Input):
    id = graphene.UUID(required=True)
    status = graphene.String(required=True)


class ApplyRegistryProposalInput(OpenIMISMutation.Input):
    id = graphene.UUID(required=True)


class ResolveValidationFindingInput(OpenIMISMutation.Input):
    id = graphene.UUID(required=True)
    resolution_status = graphene.String(required=True)


class UpdateClaimlensModuleConfigInput(OpenIMISMutation.Input):
    auto_approve_threshold = graphene.Float(required=False)
    review_threshold = graphene.Float(required=False)


class LinkDocumentToClaimInput(OpenIMISMutation.Input):
    document_uuid = graphene.UUID(required=True)
    claim_uuid = graphene.UUID(required=True)


class CreateEngineRoutingRuleInput(OpenIMISMutation.Input):
    name = graphene.String(required=True)
    engine_config_id = graphene.UUID(required=True)
    language = graphene.String(required=False)
    document_type_id = graphene.UUID(required=False)
    min_confidence = graphene.Float(required=False)
    priority = graphene.Int(required=False)
    is_active = graphene.Boolean(required=False)


class UpdateEngineRoutingRuleInput(CreateEngineRoutingRuleInput):
    id = graphene.UUID(required=True)


class SavePromptVersionInput(OpenIMISMutation.Input):
    prompt_type = graphene.String(required=True)
    content = graphene.String(required=True)
    change_summary = graphene.String(required=True)
    document_type_id = graphene.UUID(required=False)


class ActivatePromptVersionInput(OpenIMISMutation.Input):
    id = graphene.UUID(required=True)


class DeletePromptOverrideInput(OpenIMISMutation.Input):
    prompt_type = graphene.String(required=True)
    document_type_id = graphene.UUID(required=True)


class ApproveExtractionReviewInput(OpenIMISMutation.Input):
    document_uuid = graphene.UUID(required=True)
    structured_data = graphene.JSONString(required=False)


class RejectExtractionReviewInput(OpenIMISMutation.Input):
    document_uuid = graphene.UUID(required=True)


# --- Existing mutations ---

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


# --- New mutations ---

class CreateCapabilityScoreMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "CreateCapabilityScoreMutation"

    class Input(CreateCapabilityScoreInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_capability_scores_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            # Convert FK references
            data['engine_config_id'] = data.pop('engine_config_id')
            if 'document_type_id' in data and data['document_type_id']:
                data['document_type_id'] = data.pop('document_type_id')

            service = EngineCapabilityScoreService(user)
            result = service.create(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Create failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateCapabilityScoreMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateCapabilityScoreMutation"

    class Input(UpdateCapabilityScoreInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_capability_scores_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = EngineCapabilityScoreService(user)
            result = service.update(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateRoutingPolicyMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateRoutingPolicyMutation"

    class Input(UpdateRoutingPolicyInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_routing_policy_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = RoutingPolicyService(user)
            result = service.update_or_create(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class CreateValidationRuleMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "CreateValidationRuleMutation"

    class Input(CreateValidationRuleInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_validation_rules_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = ValidationRuleService(user)
            result = service.create(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Create failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateValidationRuleMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateValidationRuleMutation"

    class Input(UpdateValidationRuleInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_validation_rules_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = ValidationRuleService(user)
            result = service.update(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class RunValidationMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "RunValidationMutation"

    class Input(RunValidationInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_run_validation_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            from celery import group
            from claimlens.tasks import validate_upstream, validate_downstream

            doc_uuid = str(data['document_uuid'])
            user_id = str(user.id)

            validation_group = group(
                validate_upstream.signature(
                    args=(doc_uuid, user_id), queue='claimlens.validation'
                ),
                validate_downstream.signature(
                    args=(doc_uuid, user_id), queue='claimlens.validation'
                ),
            )
            validation_group.apply_async()
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class ReviewRegistryProposalMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "ReviewRegistryProposalMutation"

    class Input(ReviewRegistryProposalInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_registry_proposals_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = RegistryUpdateProposalService(user)
            result = service.review(data['id'], data['status'])
            if not result.get('success'):
                return [{"message": result.get('detail', 'Review failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class ApplyRegistryProposalMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "ApplyRegistryProposalMutation"

    class Input(ApplyRegistryProposalInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_registry_proposals_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = RegistryUpdateProposalService(user)
            result = service.apply(data['id'])
            if not result.get('success'):
                return [{"message": result.get('detail', 'Apply failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class ResolveValidationFindingMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "ResolveValidationFindingMutation"

    class Input(ResolveValidationFindingInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_run_validation_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            finding = ValidationFinding.objects.get(id=data['id'], is_deleted=False)
            finding.resolution_status = data['resolution_status']
            finding.save(user=user)
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateModuleConfigMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateModuleConfigMutation"

    class Input(UpdateClaimlensModuleConfigInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_module_config_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = ModuleConfigService(user)
            result = service.update_thresholds(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class LinkDocumentToClaimMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "LinkDocumentToClaimMutation"

    class Input(LinkDocumentToClaimInput):
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

            doc = Document.objects.get(id=data['document_uuid'], is_deleted=False)
            claim_uuid = data['claim_uuid']

            # Verify claim exists if claim module is installed
            try:
                from claim.models import Claim
                if not Claim.objects.filter(uuid=claim_uuid).exists():
                    return [{"message": f"Claim with UUID {claim_uuid} not found"}]
            except ImportError:
                pass  # claim module not installed — skip verification

            doc.claim_uuid = claim_uuid
            doc.save(user=user)

            AuditLog(
                document=doc,
                action=AuditLog.Action.STATUS_CHANGE,
                details={'action': 'link_to_claim', 'claim_uuid': str(claim_uuid)},
            ).save(user=user)

            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class CreateEngineRoutingRuleMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "CreateEngineRoutingRuleMutation"

    class Input(CreateEngineRoutingRuleInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_routing_rules_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = EngineRoutingRuleService(user)
            result = service.create(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Create failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class UpdateEngineRoutingRuleMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "UpdateEngineRoutingRuleMutation"

    class Input(UpdateEngineRoutingRuleInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_routing_rules_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = EngineRoutingRuleService(user)
            result = service.update(data)
            if not result.get('success'):
                return [{"message": result.get('detail', 'Update failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


# --- Prompt template mutations ---

class SavePromptVersionMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "SavePromptVersionMutation"

    class Input(SavePromptVersionInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_prompt_templates_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = PromptTemplateService(user)
            result = service.save_version(
                prompt_type=data['prompt_type'],
                content=data['content'],
                change_summary=data['change_summary'],
                document_type_id=data.get('document_type_id'),
            )
            if not result.get('success'):
                return [{"message": result.get('detail', 'Save failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class ActivatePromptVersionMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "ActivatePromptVersionMutation"

    class Input(ActivatePromptVersionInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_prompt_templates_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = PromptTemplateService(user)
            result = service.activate_version(data['id'])
            if not result.get('success'):
                return [{"message": result.get('detail', 'Activate failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class DeletePromptOverrideMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "DeletePromptOverrideMutation"

    class Input(DeletePromptOverrideInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_manage_prompt_templates_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            service = PromptTemplateService(user)
            result = service.delete_override(data['prompt_type'], data['document_type_id'])
            if not result.get('success'):
                return [{"message": result.get('detail', 'Delete failed')}]
            return None
        except Exception as exc:
            return [{"message": str(exc)}]


# --- Extraction review mutations ---

class ApproveExtractionReviewMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "ApproveExtractionReviewMutation"

    class Input(ApproveExtractionReviewInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_review_extraction_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            doc = Document.objects.get(id=data['document_uuid'], is_deleted=False)
            if doc.status != 'review_required':
                return [{"message": "Document is not in review_required status"}]

            structured_data = data.get('structured_data')
            corrected = False
            if structured_data is not None:
                extraction = ExtractionResult.objects.get(document=doc, is_deleted=False)
                extraction.structured_data = structured_data
                extraction.aggregate_confidence = 1.0
                extraction.save(user=user)
                corrected = True

            from claimlens.services import DocumentService
            DocumentService.update_status(doc, 'completed', user)

            AuditLog(
                document=doc,
                action=AuditLog.Action.REVIEW,
                details={
                    'decision': 'approved',
                    'corrected': corrected,
                    'reviewed_by': user.username,
                },
            ).save(user=user)

            return None
        except Exception as exc:
            return [{"message": str(exc)}]


class RejectExtractionReviewMutation(OpenIMISMutation):
    _mutation_module = "claimlens"
    _mutation_class = "RejectExtractionReviewMutation"

    class Input(RejectExtractionReviewInput):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(_("mutation.authentication_required"))
            if not user.has_perms(ClaimlensConfig.gql_mutation_review_extraction_perms):
                raise PermissionDenied(_("unauthorized"))

            data.pop('client_mutation_id', None)
            data.pop('client_mutation_label', None)

            doc = Document.objects.get(id=data['document_uuid'], is_deleted=False)
            if doc.status != 'review_required':
                return [{"message": "Document is not in review_required status"}]

            from claimlens.services import DocumentService
            DocumentService.update_status(
                doc, 'failed', user,
                error_message="Rejected during manual review"
            )

            AuditLog(
                document=doc,
                action=AuditLog.Action.REVIEW,
                details={
                    'decision': 'rejected',
                    'reviewed_by': user.username,
                },
            ).save(user=user)

            return None
        except Exception as exc:
            return [{"message": str(exc)}]
