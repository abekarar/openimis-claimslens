"use client";

import Link from "next/link";
import type { Document } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatFileSize } from "@/lib/utils";

export function DocumentTable({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No documents yet. Upload one to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tracking ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Filename
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Classification
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm">
                <Link
                  href={`/documents/${doc.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {doc.tracking_id}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {doc.original_filename}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatFileSize(doc.file_size_bytes)}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {doc.classification ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(doc.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
