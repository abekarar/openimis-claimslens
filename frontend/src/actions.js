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
  "dateCreated",
  "dateUpdated",
  "documentType{uuid,code,name}",
  "engineConfig{uuid,name,adapter}",
];

const CLAIMLENS_DOCUMENT_DETAIL_FIELDS = [
  ...CLAIMLENS_DOCUMENT_FIELDS,
  "extractionResult{uuid,structuredData,fieldConfidences,aggregateConfidence,rawLlmResponse,processingTimeMs,tokensUsed}",
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
  const fields = [];
  if (data.code) fields.push(`code: "${data.code}"`);
  if (data.name) fields.push(`name: "${data.name}"`);
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
