import type { Document, DocumentStatusInfo, ExtractionResult, HealthStatus } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${detail}`);
  }
  return res.json();
}

export const api = {
  health: () => request<HealthStatus>("/api/v1/health"),

  uploadDocument: async (file: File, source?: string): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    if (source) formData.append("source", source);
    return request<Document>("/api/v1/documents", {
      method: "POST",
      body: formData,
    });
  },

  getDocument: (id: string) => request<Document>(`/api/v1/documents/${id}`),

  getDocumentStatus: (id: string) =>
    request<DocumentStatusInfo>(`/api/v1/documents/${id}/status`),

  startProcessing: (id: string) =>
    request<{ status: string; document_id: string }>(`/api/v1/documents/${id}/process`, {
      method: "POST",
    }),

  getExtractionResult: (id: string) =>
    request<ExtractionResult>(`/api/v1/documents/${id}/result`),
};
