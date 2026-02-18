export type DocumentStatus =
  | "pending"
  | "preprocessing"
  | "classifying"
  | "extracting"
  | "completed"
  | "failed"
  | "review_required";

export interface Document {
  id: string;
  tracking_id: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  status: DocumentStatus;
  classification: string | null;
  class_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentStatusInfo {
  id: string;
  tracking_id: string;
  status: DocumentStatus;
  classification: string | null;
  class_confidence: number | null;
  error_detail: string | null;
  updated_at: string;
}

export interface ExtractionResult {
  id: string;
  document_id: string;
  engine_used: string;
  structured_data: Record<string, unknown> | null;
  field_confidences: Record<string, number> | null;
  aggregate_confidence: number | null;
  classification: string | null;
  routing_decision: string | null;
  processing_ms: number | null;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
}
