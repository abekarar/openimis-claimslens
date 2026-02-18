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

  fetchingAuditLogs: false,
  fetchedAuditLogs: false,
  errorAuditLogs: null,
  auditLogs: [],

  uploading: false,
  uploadProgress: 0,
  uploadResponse: null,
  uploadError: null,

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

    default:
      return state;
  }
}

export default reducer;
