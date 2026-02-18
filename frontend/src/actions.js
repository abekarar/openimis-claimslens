import {
  graphql,
  formatPageQueryWithCount,
  formatQuery,
  formatMutation,
  baseApiUrl,
} from "@openimis/fe-core";

const CLAIMLENS_DOCUMENT_FIELDS = [
  "uuid",
  "originalFilename",
  "mimeType",
  "fileSize",
  "storageKey",
  "status",
  "errorMessage",
  "celeryTaskId",
  "classificationConfidence",
  "preprocessingMetadata",
  "language",
  "claimUuid",
  "dateCreated",
  "dateUpdated",
  "documentType{uuid,code,name}",
  "engineConfig{uuid,name,adapter}",
];

const CLAIMLENS_DOCUMENT_DETAIL_FIELDS = [
  ...CLAIMLENS_DOCUMENT_FIELDS,
  "extractionResult{uuid,structuredData,fieldConfidences,aggregateConfidence,rawLlmResponse,processingTimeMs,tokensUsed}",
  "validationResults{uuid,validationType,overallStatus,fieldComparisons,discrepancyCount,matchScore,summary,validatedAt,findings{uuid,findingType,severity,field,description,details,resolutionStatus,validationRule{uuid,code,name}},registryProposals{uuid,targetModel,targetUuid,fieldName,currentValue,proposedValue,status}}",
];

const CLAIMLENS_EXTRACTION_RESULT_FIELDS = [
  "uuid",
  "structuredData",
  "fieldConfidences",
  "aggregateConfidence",
  "rawLlmResponse",
  "processingTimeMs",
  "tokensUsed",
  "dateCreated",
];

const CLAIMLENS_DOCUMENT_TYPE_FIELDS = [
  "uuid",
  "code",
  "name",
  "extractionTemplate",
  "fieldDefinitions",
  "classificationHints",
  "isActive",
  "dateCreated",
];

const CLAIMLENS_ENGINE_CONFIG_FIELDS = [
  "uuid",
  "name",
  "adapter",
  "endpointUrl",
  "modelName",
  "deploymentMode",
  "isPrimary",
  "isFallback",
  "isActive",
  "maxTokens",
  "temperature",
  "timeoutSeconds",
  "dateCreated",
];

const CLAIMLENS_AUDIT_LOG_FIELDS = [
  "uuid",
  "action",
  "details",
  "dateCreated",
  "engineConfig{uuid,name}",
];

const CLAIMLENS_CAPABILITY_SCORE_FIELDS = [
  "uuid",
  "language",
  "accuracyScore",
  "costPerPage",
  "speedScore",
  "isActive",
  "dateCreated",
  "engineConfig{uuid,name,adapter}",
  "documentType{uuid,code,name}",
];

const CLAIMLENS_ROUTING_POLICY_FIELDS = [
  "uuid",
  "accuracyWeight",
  "costWeight",
  "speedWeight",
];

const CLAIMLENS_VALIDATION_RESULT_FIELDS = [
  "uuid",
  "validationType",
  "overallStatus",
  "fieldComparisons",
  "discrepancyCount",
  "matchScore",
  "summary",
  "validatedAt",
  "dateCreated",
  "document{uuid,originalFilename}",
];

const CLAIMLENS_VALIDATION_FINDING_FIELDS = [
  "uuid",
  "findingType",
  "severity",
  "field",
  "description",
  "details",
  "resolutionStatus",
  "dateCreated",
  "validationRule{uuid,code,name}",
];

const CLAIMLENS_VALIDATION_RULE_FIELDS = [
  "uuid",
  "code",
  "name",
  "ruleType",
  "ruleDefinition",
  "severity",
  "isActive",
  "dateCreated",
];

const CLAIMLENS_REGISTRY_PROPOSAL_FIELDS = [
  "uuid",
  "targetModel",
  "targetUuid",
  "fieldName",
  "currentValue",
  "proposedValue",
  "status",
  "reviewedAt",
  "dateCreated",
  "document{uuid,originalFilename}",
  "reviewedBy{id,username}",
];

// --- Existing queries ---

export function fetchDocuments(mm, filters) {
  const payload = formatPageQueryWithCount(
    "claimlensDocuments",
    filters,
    CLAIMLENS_DOCUMENT_FIELDS
  );
  return graphql(payload, "CLAIMLENS_DOCUMENTS");
}

export function fetchDocument(mm, uuid) {
  const payload = formatQuery(
    "claimlensDocument",
    [`uuid: "${uuid}"`],
    CLAIMLENS_DOCUMENT_DETAIL_FIELDS
  );
  return graphql(payload, "CLAIMLENS_DOCUMENT");
}

export function fetchExtractionResult(mm, documentUuid) {
  const payload = formatQuery(
    "claimlensExtractionResult",
    [`documentUuid: "${documentUuid}"`],
    CLAIMLENS_EXTRACTION_RESULT_FIELDS
  );
  return graphql(payload, "CLAIMLENS_EXTRACTION_RESULT");
}

export function fetchDocumentTypes(mm, filters) {
  const payload = formatPageQueryWithCount(
    "claimlensDocumentTypes",
    filters,
    CLAIMLENS_DOCUMENT_TYPE_FIELDS
  );
  return graphql(payload, "CLAIMLENS_DOCUMENT_TYPES");
}

export function fetchEngineConfigs(mm, filters) {
  const payload = formatPageQueryWithCount(
    "claimlensEngineConfigs",
    filters,
    CLAIMLENS_ENGINE_CONFIG_FIELDS
  );
  return graphql(payload, "CLAIMLENS_ENGINE_CONFIGS");
}

export function fetchAuditLogs(mm, documentUuid) {
  const filters = documentUuid ? [`documentUuid: "${documentUuid}"`] : [];
  const payload = formatPageQueryWithCount(
    "claimlensAuditLogs",
    filters,
    CLAIMLENS_AUDIT_LOG_FIELDS
  );
  return graphql(payload, "CLAIMLENS_AUDIT_LOGS");
}

// --- Existing mutations ---

export function processDocument(uuid, clientMutationLabel) {
  const mutation = formatMutation(
    "processClaimlensDocument",
    `uuid: "${uuid}"`,
    clientMutationLabel
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_PROCESS_DOCUMENT_RESP", "CLAIMLENS_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function createDocumentType(data, clientMutationLabel) {
  if (data.code == null) throw new Error("createDocumentType: code is required");
  if (data.name == null) throw new Error("createDocumentType: name is required");
  const fields = [`code: "${data.code}"`, `name: "${data.name}"`];
  if (data.extractionTemplate) fields.push(`extractionTemplate: ${JSON.stringify(JSON.stringify(data.extractionTemplate))}`);
  if (data.fieldDefinitions) fields.push(`fieldDefinitions: ${JSON.stringify(JSON.stringify(data.fieldDefinitions))}`);
  if (data.classificationHints) fields.push(`classificationHints: "${data.classificationHints}"`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);

  const mutation = formatMutation(
    "createClaimlensDocumentType",
    fields.join(", "),
    clientMutationLabel
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_CREATE_DOCUMENT_TYPE_RESP", "CLAIMLENS_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updateDocumentType(data, clientMutationLabel) {
  if (data.id == null) throw new Error("updateDocumentType: id is required");
  const fields = [`id: "${data.id}"`];
  if (data.code) fields.push(`code: "${data.code}"`);
  if (data.name) fields.push(`name: "${data.name}"`);
  if (data.extractionTemplate) fields.push(`extractionTemplate: ${JSON.stringify(JSON.stringify(data.extractionTemplate))}`);
  if (data.fieldDefinitions) fields.push(`fieldDefinitions: ${JSON.stringify(JSON.stringify(data.fieldDefinitions))}`);
  if (data.classificationHints) fields.push(`classificationHints: "${data.classificationHints}"`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);

  const mutation = formatMutation(
    "updateClaimlensDocumentType",
    fields.join(", "),
    clientMutationLabel
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_UPDATE_DOCUMENT_TYPE_RESP", "CLAIMLENS_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function createEngineConfig(data, clientMutationLabel) {
  if (data.name == null) throw new Error("createEngineConfig: name is required");
  if (data.adapter == null) throw new Error("createEngineConfig: adapter is required");
  if (data.endpointUrl == null) throw new Error("createEngineConfig: endpointUrl is required");
  if (data.modelName == null) throw new Error("createEngineConfig: modelName is required");
  const fields = [
    `name: "${data.name}"`,
    `adapter: "${data.adapter}"`,
    `endpointUrl: "${data.endpointUrl}"`,
    `modelName: "${data.modelName}"`,
  ];
  if (data.apiKey) fields.push(`apiKey: "${data.apiKey}"`);
  if (data.deploymentMode) fields.push(`deploymentMode: "${data.deploymentMode}"`);
  if (data.isPrimary !== undefined) fields.push(`isPrimary: ${data.isPrimary}`);
  if (data.isFallback !== undefined) fields.push(`isFallback: ${data.isFallback}`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);
  if (data.maxTokens !== undefined) fields.push(`maxTokens: ${data.maxTokens}`);
  if (data.temperature !== undefined) fields.push(`temperature: ${data.temperature}`);
  if (data.timeoutSeconds !== undefined) fields.push(`timeoutSeconds: ${data.timeoutSeconds}`);

  const mutation = formatMutation(
    "createClaimlensEngineConfig",
    fields.join(", "),
    clientMutationLabel
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_CREATE_ENGINE_CONFIG_RESP", "CLAIMLENS_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updateEngineConfig(data, clientMutationLabel) {
  if (data.id == null) throw new Error("updateEngineConfig: id is required");
  const fields = [`id: "${data.id}"`];
  if (data.name) fields.push(`name: "${data.name}"`);
  if (data.adapter) fields.push(`adapter: "${data.adapter}"`);
  if (data.endpointUrl) fields.push(`endpointUrl: "${data.endpointUrl}"`);
  if (data.apiKey) fields.push(`apiKey: "${data.apiKey}"`);
  if (data.modelName) fields.push(`modelName: "${data.modelName}"`);
  if (data.deploymentMode) fields.push(`deploymentMode: "${data.deploymentMode}"`);
  if (data.isPrimary !== undefined) fields.push(`isPrimary: ${data.isPrimary}`);
  if (data.isFallback !== undefined) fields.push(`isFallback: ${data.isFallback}`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);
  if (data.maxTokens !== undefined) fields.push(`maxTokens: ${data.maxTokens}`);
  if (data.temperature !== undefined) fields.push(`temperature: ${data.temperature}`);
  if (data.timeoutSeconds !== undefined) fields.push(`timeoutSeconds: ${data.timeoutSeconds}`);

  const mutation = formatMutation(
    "updateClaimlensEngineConfig",
    fields.join(", "),
    clientMutationLabel
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_UPDATE_ENGINE_CONFIG_RESP", "CLAIMLENS_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function uploadDocument(file) {
  const url = `${window.location.origin}${baseApiUrl}/claimlens/upload/`;

  return (dispatch) => {
    dispatch({ type: "CLAIMLENS_UPLOAD_REQ" });

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token") || "";

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        dispatch({ type: "CLAIMLENS_UPLOAD_PROGRESS", payload: progress });
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          dispatch({ type: "CLAIMLENS_UPLOAD_RESP", payload: response });
        } else {
          dispatch({
            type: "CLAIMLENS_UPLOAD_ERR",
            payload: response.error || "Upload failed",
          });
        }
      } catch (e) {
        dispatch({ type: "CLAIMLENS_UPLOAD_ERR", payload: "Invalid response" });
      }
    });

    xhr.addEventListener("error", () => {
      dispatch({ type: "CLAIMLENS_UPLOAD_ERR", payload: "Network error" });
    });

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  };
}

// --- New queries ---

export function fetchCapabilityScores(mm, filters) {
  const payload = formatPageQueryWithCount(
    "claimlensCapabilityScores",
    filters,
    CLAIMLENS_CAPABILITY_SCORE_FIELDS
  );
  return graphql(payload, "CLAIMLENS_CAPABILITY_SCORES");
}

export function fetchRoutingPolicy(mm) {
  const payload = formatQuery(
    "claimlensRoutingPolicy",
    [],
    CLAIMLENS_ROUTING_POLICY_FIELDS
  );
  return graphql(payload, "CLAIMLENS_ROUTING_POLICY");
}

export function fetchValidationResults(mm, documentUuid) {
  const filters = documentUuid ? [`documentUuid: "${documentUuid}"`] : [];
  const payload = formatPageQueryWithCount(
    "claimlensValidationResults",
    filters,
    CLAIMLENS_VALIDATION_RESULT_FIELDS
  );
  return graphql(payload, "CLAIMLENS_VALIDATION_RESULTS");
}

export function fetchValidationRules(mm, filters) {
  const payload = formatPageQueryWithCount(
    "claimlensValidationRules",
    filters,
    CLAIMLENS_VALIDATION_RULE_FIELDS
  );
  return graphql(payload, "CLAIMLENS_VALIDATION_RULES");
}

export function fetchValidationRule(mm, uuid) {
  const payload = formatQuery(
    "claimlensValidationRule",
    [`uuid: "${uuid}"`],
    CLAIMLENS_VALIDATION_RULE_FIELDS
  );
  return graphql(payload, "CLAIMLENS_VALIDATION_RULE");
}

export function fetchRegistryProposals(mm, documentUuid) {
  const filters = documentUuid ? [`documentUuid: "${documentUuid}"`] : [];
  const payload = formatPageQueryWithCount(
    "claimlensRegistryProposals",
    filters,
    CLAIMLENS_REGISTRY_PROPOSAL_FIELDS
  );
  return graphql(payload, "CLAIMLENS_REGISTRY_PROPOSALS");
}

// --- New mutations ---

export function createCapabilityScore(data, clientMutationLabel) {
  if (data.engineConfigId == null) throw new Error("createCapabilityScore: engineConfigId is required");
  if (data.language == null) throw new Error("createCapabilityScore: language is required");
  const fields = [
    `engineConfigId: "${data.engineConfigId}"`,
    `language: "${data.language}"`,
  ];
  if (data.documentTypeId) fields.push(`documentTypeId: "${data.documentTypeId}"`);
  if (data.accuracyScore !== undefined) fields.push(`accuracyScore: ${data.accuracyScore}`);
  if (data.costPerPage !== undefined) fields.push(`costPerPage: ${data.costPerPage}`);
  if (data.speedScore !== undefined) fields.push(`speedScore: ${data.speedScore}`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);

  const mutation = formatMutation("createClaimlensCapabilityScore", fields.join(", "), clientMutationLabel);
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_CREATE_CAPABILITY_SCORE_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function updateCapabilityScore(data, clientMutationLabel) {
  if (data.id == null) throw new Error("updateCapabilityScore: id is required");
  const fields = [`id: "${data.id}"`];
  if (data.engineConfigId) fields.push(`engineConfigId: "${data.engineConfigId}"`);
  if (data.language) fields.push(`language: "${data.language}"`);
  if (data.documentTypeId) fields.push(`documentTypeId: "${data.documentTypeId}"`);
  if (data.accuracyScore !== undefined) fields.push(`accuracyScore: ${data.accuracyScore}`);
  if (data.costPerPage !== undefined) fields.push(`costPerPage: ${data.costPerPage}`);
  if (data.speedScore !== undefined) fields.push(`speedScore: ${data.speedScore}`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);

  const mutation = formatMutation("updateClaimlensCapabilityScore", fields.join(", "), clientMutationLabel);
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_UPDATE_CAPABILITY_SCORE_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function updateRoutingPolicy(data, clientMutationLabel) {
  const fields = [];
  if (data.accuracyWeight !== undefined) fields.push(`accuracyWeight: ${data.accuracyWeight}`);
  if (data.costWeight !== undefined) fields.push(`costWeight: ${data.costWeight}`);
  if (data.speedWeight !== undefined) fields.push(`speedWeight: ${data.speedWeight}`);

  const mutation = formatMutation("updateClaimlensRoutingPolicy", fields.join(", "), clientMutationLabel);
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_UPDATE_ROUTING_POLICY_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function createValidationRule(data, clientMutationLabel) {
  if (data.code == null) throw new Error("createValidationRule: code is required");
  if (data.name == null) throw new Error("createValidationRule: name is required");
  if (data.ruleType == null) throw new Error("createValidationRule: ruleType is required");
  const fields = [
    `code: "${data.code}"`,
    `name: "${data.name}"`,
    `ruleType: "${data.ruleType}"`,
  ];
  if (data.ruleDefinition) fields.push(`ruleDefinition: ${JSON.stringify(JSON.stringify(data.ruleDefinition))}`);
  if (data.severity) fields.push(`severity: "${data.severity}"`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);

  const mutation = formatMutation("createClaimlensValidationRule", fields.join(", "), clientMutationLabel);
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_CREATE_VALIDATION_RULE_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function updateValidationRule(data, clientMutationLabel) {
  if (data.id == null) throw new Error("updateValidationRule: id is required");
  const fields = [`id: "${data.id}"`];
  if (data.code) fields.push(`code: "${data.code}"`);
  if (data.name) fields.push(`name: "${data.name}"`);
  if (data.ruleType) fields.push(`ruleType: "${data.ruleType}"`);
  if (data.ruleDefinition) fields.push(`ruleDefinition: ${JSON.stringify(JSON.stringify(data.ruleDefinition))}`);
  if (data.severity) fields.push(`severity: "${data.severity}"`);
  if (data.isActive !== undefined) fields.push(`isActive: ${data.isActive}`);

  const mutation = formatMutation("updateClaimlensValidationRule", fields.join(", "), clientMutationLabel);
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_UPDATE_VALIDATION_RULE_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function runValidation(documentUuid, clientMutationLabel) {
  const mutation = formatMutation(
    "runClaimlensValidation",
    `documentUuid: "${documentUuid}"`,
    clientMutationLabel
  );
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_RUN_VALIDATION_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function reviewRegistryProposal(id, status, clientMutationLabel) {
  const mutation = formatMutation(
    "reviewClaimlensRegistryProposal",
    `id: "${id}", status: "${status}"`,
    clientMutationLabel
  );
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_REVIEW_REGISTRY_PROPOSAL_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function applyRegistryProposal(id, clientMutationLabel) {
  const mutation = formatMutation(
    "applyClaimlensRegistryProposal",
    `id: "${id}"`,
    clientMutationLabel
  );
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_APPLY_REGISTRY_PROPOSAL_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}

export function resolveValidationFinding(id, resolutionStatus, clientMutationLabel) {
  const mutation = formatMutation(
    "resolveClaimlensValidationFinding",
    `id: "${id}", resolutionStatus: "${resolutionStatus}"`,
    clientMutationLabel
  );
  return graphql(
    mutation.payload,
    ["CLAIMLENS_MUTATION_REQ", "CLAIMLENS_RESOLVE_VALIDATION_FINDING_RESP", "CLAIMLENS_MUTATION_ERR"],
    { clientMutationId: mutation.clientMutationId, clientMutationLabel, requestedDateTime: new Date() }
  );
}
