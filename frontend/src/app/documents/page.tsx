"use client";

import { DocumentTable } from "@/components/documents/document-table";

export default function DocumentsPage() {
  // TODO: Fetch documents list from API with pagination
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage processed claim documents.
        </p>
      </div>
      <DocumentTable documents={[]} />
    </div>
  );
}
