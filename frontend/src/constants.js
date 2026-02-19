export const MODULE_NAME = "claimlens";

// Permission codes
export const RIGHT_CLAIMLENS = 159000;
export const RIGHT_CLAIMLENS_DOCUMENTS = 159001;
export const RIGHT_CLAIMLENS_EXTRACTION_RESULTS = 159002;
export const RIGHT_CLAIMLENS_UPLOAD = 159003;
export const RIGHT_CLAIMLENS_PROCESS = 159004;
export const RIGHT_CLAIMLENS_DOCUMENT_TYPES = 159005;
export const RIGHT_CLAIMLENS_MANAGE_DOCUMENT_TYPES = 159006;
export const RIGHT_CLAIMLENS_ENGINE_CONFIGS = 159007;
export const RIGHT_CLAIMLENS_MANAGE_ENGINE_CONFIGS = 159008;
export const RIGHT_CLAIMLENS_VALIDATION_RESULTS = 159009;
export const RIGHT_CLAIMLENS_RUN_VALIDATION = 159010;
export const RIGHT_CLAIMLENS_VALIDATION_RULES = 159011;
export const RIGHT_CLAIMLENS_MANAGE_VALIDATION_RULES = 159012;
export const RIGHT_CLAIMLENS_REGISTRY_PROPOSALS = 159013;
export const RIGHT_CLAIMLENS_MANAGE_REGISTRY_PROPOSALS = 159014;
export const RIGHT_CLAIMLENS_CAPABILITY_SCORES = 159015;
export const RIGHT_CLAIMLENS_MANAGE_CAPABILITY_SCORES = 159016;
export const RIGHT_CLAIMLENS_ROUTING_POLICY = 159017;
export const RIGHT_CLAIMLENS_MANAGE_ROUTING_POLICY = 159018;
export const RIGHT_CLAIMLENS_MODULE_CONFIG = 159019;
export const RIGHT_CLAIMLENS_MANAGE_ENGINE_ROUTING_RULES = 159020;
export const RIGHT_CLAIMLENS_ENGINE_ROUTING_RULES = 159021;

// Document statuses
export const STATUS_PENDING = "pending";
export const STATUS_PREPROCESSING = "preprocessing";
export const STATUS_CLASSIFYING = "classifying";
export const STATUS_EXTRACTING = "extracting";
export const STATUS_COMPLETED = "completed";
export const STATUS_FAILED = "failed";
export const STATUS_REVIEW_REQUIRED = "review_required";

export const DOCUMENT_STATUSES = [
  STATUS_PENDING,
  STATUS_PREPROCESSING,
  STATUS_CLASSIFYING,
  STATUS_EXTRACTING,
  STATUS_COMPLETED,
  STATUS_FAILED,
  STATUS_REVIEW_REQUIRED,
];

export const PROCESSING_STATUSES = [
  STATUS_PREPROCESSING,
  STATUS_CLASSIFYING,
  STATUS_EXTRACTING,
];

export const TERMINAL_STATUSES = [
  STATUS_COMPLETED,
  STATUS_FAILED,
  STATUS_REVIEW_REQUIRED,
];

// Validation statuses
export const VALIDATION_STATUS_MATCHED = "matched";
export const VALIDATION_STATUS_MISMATCHED = "mismatched";
export const VALIDATION_STATUS_PARTIAL_MATCH = "partial_match";
export const VALIDATION_STATUS_PENDING = "pending";
export const VALIDATION_STATUS_ERROR = "error";

export const VALIDATION_STATUSES = [
  VALIDATION_STATUS_MATCHED,
  VALIDATION_STATUS_MISMATCHED,
  VALIDATION_STATUS_PARTIAL_MATCH,
  VALIDATION_STATUS_PENDING,
  VALIDATION_STATUS_ERROR,
];

// Validation types
export const VALIDATION_TYPE_UPSTREAM = "upstream";
export const VALIDATION_TYPE_DOWNSTREAM = "downstream";

// Finding types
export const FINDING_TYPE_VIOLATION = "violation";
export const FINDING_TYPE_WARNING = "warning";
export const FINDING_TYPE_UPDATE_PROPOSAL = "update_proposal";

// Severity levels
export const SEVERITY_INFO = "info";
export const SEVERITY_WARNING = "warning";
export const SEVERITY_ERROR = "error";

export const SEVERITY_LEVELS = [SEVERITY_INFO, SEVERITY_WARNING, SEVERITY_ERROR];

// Finding resolution statuses
export const RESOLUTION_PENDING = "pending";
export const RESOLUTION_ACCEPTED = "accepted";
export const RESOLUTION_REJECTED = "rejected";
export const RESOLUTION_DEFERRED = "deferred";

export const RESOLUTION_STATUSES = [
  RESOLUTION_PENDING,
  RESOLUTION_ACCEPTED,
  RESOLUTION_REJECTED,
  RESOLUTION_DEFERRED,
];

// Registry proposal statuses
export const PROPOSAL_PROPOSED = "proposed";
export const PROPOSAL_APPROVED = "approved";
export const PROPOSAL_APPLIED = "applied";
export const PROPOSAL_REJECTED = "rejected";

export const PROPOSAL_STATUSES = [
  PROPOSAL_PROPOSED,
  PROPOSAL_APPROVED,
  PROPOSAL_APPLIED,
  PROPOSAL_REJECTED,
];

// Rule types
export const RULE_TYPE_ELIGIBILITY = "eligibility";
export const RULE_TYPE_CLINICAL = "clinical";
export const RULE_TYPE_FRAUD = "fraud";
export const RULE_TYPE_REGISTRY = "registry";

export const RULE_TYPES = [
  RULE_TYPE_ELIGIBILITY,
  RULE_TYPE_CLINICAL,
  RULE_TYPE_FRAUD,
  RULE_TYPE_REGISTRY,
];

// File limits
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
];

// Confidence thresholds
export const CONFIDENCE_HIGH = 0.90;
export const CONFIDENCE_MEDIUM = 0.60;

// Polling
export const POLL_INTERVAL_MS = 5000;
export const POLL_MAX_ATTEMPTS = 60;

// Routes
export const ROUTE_CLAIMLENS_DOCUMENTS = "claimlens/documents";
export const ROUTE_CLAIMLENS_DOCUMENT = "claimlens/documents/document";
export const ROUTE_CLAIMLENS_UPLOAD = "claimlens/upload";
export const ROUTE_CLAIMLENS_VALIDATION_RULE = "claimlens/validation-rules/rule";
export const ROUTE_CLAIMLENS_SETTINGS = "claimlens/settings";
export const ROUTE_CLAIMLENS_DASHBOARD = "claimlens/dashboard";
