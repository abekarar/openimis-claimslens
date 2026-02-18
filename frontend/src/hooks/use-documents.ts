"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => api.getDocument(id),
    enabled: !!id,
  });
}

export function useDocumentStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ["document-status", id],
    queryFn: () => api.getDocumentStatus(id),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 3000;
      if (["completed", "failed", "review_required"].includes(status)) return false;
      return 3000;
    },
  });
}

export function useExtractionResult(id: string, enabled = true) {
  return useQuery({
    queryKey: ["extraction-result", id],
    queryFn: () => api.getExtractionResult(id),
    enabled: !!id && enabled,
  });
}
