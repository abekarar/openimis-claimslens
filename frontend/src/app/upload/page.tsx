"use client";

import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/upload/dropzone";
import type { Document } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();

  const handleUploaded = (doc: Document) => {
    setTimeout(() => {
      router.push(`/documents/${doc.id}`);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Upload Document</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload a scanned claim document for AI-powered data extraction.
        </p>
      </div>
      <Dropzone onUploaded={handleUploaded} />
    </div>
  );
}
