"use client";

import { use } from "react";
import { useDocument, useDocumentStatus, useExtractionResult } from "@/hooks/use-documents";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfidenceBar } from "@/components/ui/confidence-bar";
import { formatDate, formatFileSize } from "@/lib/utils";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: document, isLoading } = useDocument(id);
  const { data: status } = useDocumentStatus(id, !!document);
  const isTerminal = status
    ? ["completed", "failed", "review_required"].includes(status.status)
    : false;
  const { data: extraction } = useExtractionResult(id, isTerminal);

  if (isLoading) {
    return <div className="text-gray-500">Loading document...</div>;
  }

  if (!document) {
    return <div className="text-red-500">Document not found</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {document.tracking_id}
          </h2>
          <p className="text-sm text-gray-500">{document.original_filename}</p>
        </div>
        <StatusBadge status={status?.status ?? document.status} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
          <h3 className="font-medium text-gray-900">Document Info</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">File size</dt>
              <dd>{formatFileSize(document.file_size_bytes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">MIME type</dt>
              <dd>{document.mime_type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Pages</dt>
              <dd>{document.page_count ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd>{formatDate(document.created_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
          <h3 className="font-medium text-gray-900">Classification</h3>
          {document.classification ? (
            <>
              <p className="text-lg font-medium">{document.classification}</p>
              {document.class_confidence != null && (
                <ConfidenceBar
                  value={document.class_confidence}
                  label="Confidence"
                />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">Not yet classified</p>
          )}
        </div>
      </div>

      {extraction && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Extraction Results</h3>
            {extraction.aggregate_confidence != null && (
              <div className="w-48">
                <ConfidenceBar
                  value={extraction.aggregate_confidence}
                  label="Overall"
                />
              </div>
            )}
          </div>

          {extraction.structured_data && (
            <div className="space-y-2">
              {Object.entries(extraction.structured_data).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
                >
                  <span className="text-sm font-medium text-gray-600">
                    {key.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-900">
                      {String(value ?? "—")}
                    </span>
                    {extraction.field_confidences?.[key] != null && (
                      <div className="w-24">
                        <ConfidenceBar
                          value={extraction.field_confidences[key]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-400">
            Engine: {extraction.engine_used} — {extraction.processing_ms}ms
          </div>
        </div>
      )}

      {status?.error_detail && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{status.error_detail}</p>
        </div>
      )}
    </div>
  );
}
