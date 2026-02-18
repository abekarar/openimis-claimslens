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
