import {
  parseData,
  pageInfo,
  formatServerError,
  formatGraphQLError,
  dispatchMutationReq,
  dispatchMutationResp,
  dispatchMutationErr,
} from "@openimis/fe-core";

const initialState = {
  fetchingDocuments: false,
  fetchedDocuments: false,
  errorDocuments: null,
  documents: [],
  documentsPageInfo: { totalCount: 0 },

  fetchingDocument: false,
  fetchedDocument: false,
  errorDocument: null,
  document: null,

  fetchingExtractionResult: false,
  fetchedExtractionResult: false,
  errorExtractionResult: null,
  extractionResult: null,

  fetchingDocumentTypes: false,
  fetchedDocumentTypes: false,
  errorDocumentTypes: null,
  documentTypes: [],
  documentTypesPageInfo: { totalCount: 0 },

  fetchingEngineConfigs: false,
  fetchedEngineConfigs: false,
  errorEngineConfigs: null,
  engineConfigs: [],
  engineConfigsPageInfo: { totalCount: 0 },

  fetchingAuditLogs: false,
  fetchedAuditLogs: false,
  errorAuditLogs: null,
  auditLogs: [],

  uploading: false,
  uploadProgress: 0,
  uploadResponse: null,
  uploadError: null,

  // Capability scores
  fetchingCapabilityScores: false,
  fetchedCapabilityScores: false,
  errorCapabilityScores: null,
  capabilityScores: [],
  capabilityScoresPageInfo: { totalCount: 0 },

  // Routing policy
  fetchingRoutingPolicy: false,
  fetchedRoutingPolicy: false,
  errorRoutingPolicy: null,
  routingPolicy: null,

  // Validation results
  fetchingValidationResults: false,
  fetchedValidationResults: false,
  errorValidationResults: null,
  validationResults: [],

  // Validation rules
  fetchingValidationRules: false,
  fetchedValidationRules: false,
  errorValidationRules: null,
  validationRules: [],
  validationRulesPageInfo: { totalCount: 0 },

  // Single validation rule
  fetchingValidationRule: false,
  fetchedValidationRule: false,
  errorValidationRule: null,
  validationRule: null,

  // Registry proposals
  fetchingRegistryProposals: false,
  fetchedRegistryProposals: false,
  errorRegistryProposals: null,
  registryProposals: [],

  // Engine routing rules
  fetchingEngineRoutingRules: false,
  fetchedEngineRoutingRules: false,
  errorEngineRoutingRules: null,
  engineRoutingRules: [],
  engineRoutingRulesPageInfo: { totalCount: 0 },

  // Prompt templates
  fetchingPromptTemplates: false,
  fetchedPromptTemplates: false,
  errorPromptTemplates: null,
  promptTemplates: [],
  promptTemplatesPageInfo: { totalCount: 0 },

  // Prompt version history
  fetchingPromptVersionHistory: false,
  fetchedPromptVersionHistory: false,
  errorPromptVersionHistory: null,
  promptVersionHistory: [],
  promptVersionHistoryPageInfo: { totalCount: 0 },

  submittingMutation: false,
  mutation: {},
};

function reducer(state = initialState, action) {
  switch (action.type) {
    // Documents list
    case "CLAIMLENS_DOCUMENTS_REQ":
      return {
        ...state,
        fetchingDocuments: true,
        fetchedDocuments: false,
        documents: [],
        errorDocuments: null,
      };
    case "CLAIMLENS_DOCUMENTS_RESP":
      return {
        ...state,
        fetchingDocuments: false,
        fetchedDocuments: true,
        documents: parseData(action.payload.data.claimlensDocuments),
        documentsPageInfo: pageInfo(action.payload.data.claimlensDocuments),
        errorDocuments: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_DOCUMENTS_ERR":
      return {
        ...state,
        fetchingDocuments: false,
        errorDocuments: formatServerError(action.payload),
      };

    // Single document
    case "CLAIMLENS_DOCUMENT_REQ":
      return {
        ...state,
        fetchingDocument: true,
        fetchedDocument: false,
        document: null,
        errorDocument: null,
      };
    case "CLAIMLENS_DOCUMENT_RESP":
      return {
        ...state,
        fetchingDocument: false,
        fetchedDocument: true,
        document: action.payload.data.claimlensDocument,
        errorDocument: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_DOCUMENT_ERR":
      return {
        ...state,
        fetchingDocument: false,
        errorDocument: formatServerError(action.payload),
      };

    // Extraction result
    case "CLAIMLENS_EXTRACTION_RESULT_REQ":
      return {
        ...state,
        fetchingExtractionResult: true,
        fetchedExtractionResult: false,
        extractionResult: null,
        errorExtractionResult: null,
      };
    case "CLAIMLENS_EXTRACTION_RESULT_RESP":
      return {
        ...state,
        fetchingExtractionResult: false,
        fetchedExtractionResult: true,
        extractionResult: action.payload.data.claimlensExtractionResult,
        errorExtractionResult: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_EXTRACTION_RESULT_ERR":
      return {
        ...state,
        fetchingExtractionResult: false,
        errorExtractionResult: formatServerError(action.payload),
      };

    // Document types
    case "CLAIMLENS_DOCUMENT_TYPES_REQ":
      return {
        ...state,
        fetchingDocumentTypes: true,
        fetchedDocumentTypes: false,
        documentTypes: [],
        errorDocumentTypes: null,
      };
    case "CLAIMLENS_DOCUMENT_TYPES_RESP":
      return {
        ...state,
        fetchingDocumentTypes: false,
        fetchedDocumentTypes: true,
        documentTypes: parseData(action.payload.data.claimlensDocumentTypes),
        documentTypesPageInfo: pageInfo(action.payload.data.claimlensDocumentTypes),
        errorDocumentTypes: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_DOCUMENT_TYPES_ERR":
      return {
        ...state,
        fetchingDocumentTypes: false,
        errorDocumentTypes: formatServerError(action.payload),
      };

    // Engine configs
    case "CLAIMLENS_ENGINE_CONFIGS_REQ":
      return {
        ...state,
        fetchingEngineConfigs: true,
        fetchedEngineConfigs: false,
        engineConfigs: [],
        errorEngineConfigs: null,
      };
    case "CLAIMLENS_ENGINE_CONFIGS_RESP":
      return {
        ...state,
        fetchingEngineConfigs: false,
        fetchedEngineConfigs: true,
        engineConfigs: parseData(action.payload.data.claimlensEngineConfigs),
        engineConfigsPageInfo: pageInfo(action.payload.data.claimlensEngineConfigs),
        errorEngineConfigs: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_ENGINE_CONFIGS_ERR":
      return {
        ...state,
        fetchingEngineConfigs: false,
        errorEngineConfigs: formatServerError(action.payload),
      };

    // Audit logs
    case "CLAIMLENS_AUDIT_LOGS_REQ":
      return {
        ...state,
        fetchingAuditLogs: true,
        fetchedAuditLogs: false,
        auditLogs: [],
        errorAuditLogs: null,
      };
    case "CLAIMLENS_AUDIT_LOGS_RESP":
      return {
        ...state,
        fetchingAuditLogs: false,
        fetchedAuditLogs: true,
        auditLogs: parseData(action.payload.data.claimlensAuditLogs),
        errorAuditLogs: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_AUDIT_LOGS_ERR":
      return {
        ...state,
        fetchingAuditLogs: false,
        errorAuditLogs: formatServerError(action.payload),
      };

    // Upload
    case "CLAIMLENS_UPLOAD_REQ":
      return {
        ...state,
        uploading: true,
        uploadProgress: 0,
        uploadResponse: null,
        uploadError: null,
      };
    case "CLAIMLENS_UPLOAD_PROGRESS":
      return {
        ...state,
        uploadProgress: action.payload,
      };
    case "CLAIMLENS_UPLOAD_RESP":
      return {
        ...state,
        uploading: false,
        uploadProgress: 100,
        uploadResponse: action.payload,
      };
    case "CLAIMLENS_UPLOAD_ERR":
      return {
        ...state,
        uploading: false,
        uploadProgress: 0,
        uploadError: action.payload,
      };

    // Capability scores
    case "CLAIMLENS_CAPABILITY_SCORES_REQ":
      return { ...state, fetchingCapabilityScores: true, fetchedCapabilityScores: false, capabilityScores: [], errorCapabilityScores: null };
    case "CLAIMLENS_CAPABILITY_SCORES_RESP":
      return {
        ...state,
        fetchingCapabilityScores: false,
        fetchedCapabilityScores: true,
        capabilityScores: parseData(action.payload.data.claimlensCapabilityScores),
        capabilityScoresPageInfo: pageInfo(action.payload.data.claimlensCapabilityScores),
        errorCapabilityScores: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_CAPABILITY_SCORES_ERR":
      return { ...state, fetchingCapabilityScores: false, errorCapabilityScores: formatServerError(action.payload) };

    // Routing policy
    case "CLAIMLENS_ROUTING_POLICY_REQ":
      return { ...state, fetchingRoutingPolicy: true, fetchedRoutingPolicy: false, routingPolicy: null, errorRoutingPolicy: null };
    case "CLAIMLENS_ROUTING_POLICY_RESP":
      return {
        ...state,
        fetchingRoutingPolicy: false,
        fetchedRoutingPolicy: true,
        routingPolicy: action.payload.data.claimlensRoutingPolicy,
        errorRoutingPolicy: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_ROUTING_POLICY_ERR":
      return { ...state, fetchingRoutingPolicy: false, errorRoutingPolicy: formatServerError(action.payload) };

    // Validation results
    case "CLAIMLENS_VALIDATION_RESULTS_REQ":
      return { ...state, fetchingValidationResults: true, fetchedValidationResults: false, validationResults: [], errorValidationResults: null };
    case "CLAIMLENS_VALIDATION_RESULTS_RESP":
      return {
        ...state,
        fetchingValidationResults: false,
        fetchedValidationResults: true,
        validationResults: parseData(action.payload.data.claimlensValidationResults),
        errorValidationResults: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_VALIDATION_RESULTS_ERR":
      return { ...state, fetchingValidationResults: false, errorValidationResults: formatServerError(action.payload) };

    // Validation rules
    case "CLAIMLENS_VALIDATION_RULES_REQ":
      return { ...state, fetchingValidationRules: true, fetchedValidationRules: false, validationRules: [], errorValidationRules: null };
    case "CLAIMLENS_VALIDATION_RULES_RESP":
      return {
        ...state,
        fetchingValidationRules: false,
        fetchedValidationRules: true,
        validationRules: parseData(action.payload.data.claimlensValidationRules),
        validationRulesPageInfo: pageInfo(action.payload.data.claimlensValidationRules),
        errorValidationRules: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_VALIDATION_RULES_ERR":
      return { ...state, fetchingValidationRules: false, errorValidationRules: formatServerError(action.payload) };

    // Single validation rule
    case "CLAIMLENS_VALIDATION_RULE_REQ":
      return { ...state, fetchingValidationRule: true, fetchedValidationRule: false, validationRule: null, errorValidationRule: null };
    case "CLAIMLENS_VALIDATION_RULE_RESP":
      return {
        ...state,
        fetchingValidationRule: false,
        fetchedValidationRule: true,
        validationRule: action.payload.data.claimlensValidationRule,
        errorValidationRule: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_VALIDATION_RULE_ERR":
      return { ...state, fetchingValidationRule: false, errorValidationRule: formatServerError(action.payload) };

    // Registry proposals
    case "CLAIMLENS_REGISTRY_PROPOSALS_REQ":
      return { ...state, fetchingRegistryProposals: true, fetchedRegistryProposals: false, registryProposals: [], errorRegistryProposals: null };
    case "CLAIMLENS_REGISTRY_PROPOSALS_RESP":
      return {
        ...state,
        fetchingRegistryProposals: false,
        fetchedRegistryProposals: true,
        registryProposals: parseData(action.payload.data.claimlensRegistryProposals),
        errorRegistryProposals: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_REGISTRY_PROPOSALS_ERR":
      return { ...state, fetchingRegistryProposals: false, errorRegistryProposals: formatServerError(action.payload) };

    // Engine routing rules
    case "CLAIMLENS_ENGINE_ROUTING_RULES_REQ":
      return { ...state, fetchingEngineRoutingRules: true, fetchedEngineRoutingRules: false, engineRoutingRules: [], errorEngineRoutingRules: null };
    case "CLAIMLENS_ENGINE_ROUTING_RULES_RESP":
      return {
        ...state,
        fetchingEngineRoutingRules: false,
        fetchedEngineRoutingRules: true,
        engineRoutingRules: parseData(action.payload.data.claimlensEngineRoutingRules),
        engineRoutingRulesPageInfo: pageInfo(action.payload.data.claimlensEngineRoutingRules),
        errorEngineRoutingRules: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_ENGINE_ROUTING_RULES_ERR":
      return { ...state, fetchingEngineRoutingRules: false, errorEngineRoutingRules: formatServerError(action.payload) };

    // Prompt templates
    case "CLAIMLENS_PROMPT_TEMPLATES_REQ":
      return { ...state, fetchingPromptTemplates: true, fetchedPromptTemplates: false, promptTemplates: [], errorPromptTemplates: null };
    case "CLAIMLENS_PROMPT_TEMPLATES_RESP":
      return {
        ...state,
        fetchingPromptTemplates: false,
        fetchedPromptTemplates: true,
        promptTemplates: parseData(action.payload.data.claimlensPromptTemplates),
        promptTemplatesPageInfo: pageInfo(action.payload.data.claimlensPromptTemplates),
        errorPromptTemplates: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_PROMPT_TEMPLATES_ERR":
      return { ...state, fetchingPromptTemplates: false, errorPromptTemplates: formatServerError(action.payload) };

    // Prompt version history
    case "CLAIMLENS_PROMPT_VERSION_HISTORY_REQ":
      return { ...state, fetchingPromptVersionHistory: true, fetchedPromptVersionHistory: false, promptVersionHistory: [], errorPromptVersionHistory: null };
    case "CLAIMLENS_PROMPT_VERSION_HISTORY_RESP":
      return {
        ...state,
        fetchingPromptVersionHistory: false,
        fetchedPromptVersionHistory: true,
        promptVersionHistory: parseData(action.payload.data.claimlensPromptTemplates),
        promptVersionHistoryPageInfo: pageInfo(action.payload.data.claimlensPromptTemplates),
        errorPromptVersionHistory: formatGraphQLError(action.payload),
      };
    case "CLAIMLENS_PROMPT_VERSION_HISTORY_ERR":
      return { ...state, fetchingPromptVersionHistory: false, errorPromptVersionHistory: formatServerError(action.payload) };

    // Mutations
    case "CLAIMLENS_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "CLAIMLENS_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "CLAIMLENS_PROCESS_DOCUMENT_RESP":
      return dispatchMutationResp(state, "processClaimlensDocument", action);
    case "CLAIMLENS_CREATE_DOCUMENT_TYPE_RESP":
      return dispatchMutationResp(state, "createClaimlensDocumentType", action);
    case "CLAIMLENS_UPDATE_DOCUMENT_TYPE_RESP":
      return dispatchMutationResp(state, "updateClaimlensDocumentType", action);
    case "CLAIMLENS_CREATE_ENGINE_CONFIG_RESP":
      return dispatchMutationResp(state, "createClaimlensEngineConfig", action);
    case "CLAIMLENS_UPDATE_ENGINE_CONFIG_RESP":
      return dispatchMutationResp(state, "updateClaimlensEngineConfig", action);
    case "CLAIMLENS_CREATE_CAPABILITY_SCORE_RESP":
      return dispatchMutationResp(state, "createClaimlensCapabilityScore", action);
    case "CLAIMLENS_UPDATE_CAPABILITY_SCORE_RESP":
      return dispatchMutationResp(state, "updateClaimlensCapabilityScore", action);
    case "CLAIMLENS_UPDATE_ROUTING_POLICY_RESP":
      return dispatchMutationResp(state, "updateClaimlensRoutingPolicy", action);
    case "CLAIMLENS_CREATE_VALIDATION_RULE_RESP":
      return dispatchMutationResp(state, "createClaimlensValidationRule", action);
    case "CLAIMLENS_UPDATE_VALIDATION_RULE_RESP":
      return dispatchMutationResp(state, "updateClaimlensValidationRule", action);
    case "CLAIMLENS_RUN_VALIDATION_RESP":
      return dispatchMutationResp(state, "runClaimlensValidation", action);
    case "CLAIMLENS_REVIEW_REGISTRY_PROPOSAL_RESP":
      return dispatchMutationResp(state, "reviewClaimlensRegistryProposal", action);
    case "CLAIMLENS_APPLY_REGISTRY_PROPOSAL_RESP":
      return dispatchMutationResp(state, "applyClaimlensRegistryProposal", action);
    case "CLAIMLENS_RESOLVE_VALIDATION_FINDING_RESP":
      return dispatchMutationResp(state, "resolveClaimlensValidationFinding", action);
    case "CLAIMLENS_LINK_DOCUMENT_TO_CLAIM_RESP":
      return dispatchMutationResp(state, "linkClaimlensDocumentToClaim", action);
    case "CLAIMLENS_UPDATE_MODULE_CONFIG_RESP":
      return dispatchMutationResp(state, "updateClaimlensModuleConfig", action);
    case "CLAIMLENS_CREATE_ENGINE_ROUTING_RULE_RESP":
      return dispatchMutationResp(state, "createClaimlensEngineRoutingRule", action);
    case "CLAIMLENS_UPDATE_ENGINE_ROUTING_RULE_RESP":
      return dispatchMutationResp(state, "updateClaimlensEngineRoutingRule", action);
    case "CLAIMLENS_SAVE_PROMPT_VERSION_RESP":
      return dispatchMutationResp(state, "saveClaimlensPromptVersion", action);
    case "CLAIMLENS_ACTIVATE_PROMPT_VERSION_RESP":
      return dispatchMutationResp(state, "activateClaimlensPromptVersion", action);
    case "CLAIMLENS_DELETE_PROMPT_OVERRIDE_RESP":
      return dispatchMutationResp(state, "deleteClaimlensPromptOverride", action);
    case "CLAIMLENS_APPROVE_EXTRACTION_REVIEW_RESP":
      return dispatchMutationResp(state, "approveClaimlensExtractionReview", action);
    case "CLAIMLENS_REJECT_EXTRACTION_REVIEW_RESP":
      return dispatchMutationResp(state, "rejectClaimlensExtractionReview", action);

    default:
      return state;
  }
}

export default reducer;
