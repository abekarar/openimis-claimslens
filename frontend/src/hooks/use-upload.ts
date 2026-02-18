"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Document } from "@/lib/types";

export function useUpload() {
  return useMutation<Document, Error, File>({
    mutationFn: (file) => api.uploadDocument(file),
  });
}
