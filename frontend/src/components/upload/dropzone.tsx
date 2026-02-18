"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { cn, formatFileSize } from "@/lib/utils";
import type { Document } from "@/lib/types";

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/tiff": [".tiff", ".tif"],
  "application/pdf": [".pdf"],
};

export function Dropzone({ onUploaded }: { onUploaded?: (doc: Document) => void }) {
  const upload = useUpload();
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploadedFile(file.name);
      upload.mutate(file, {
        onSuccess: (doc) => {
          onUploaded?.(doc);
        },
      });
    },
    [upload, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer",
        isDragActive
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      )}
    >
      <input {...getInputProps()} />
      {upload.isPending ? (
        <>
          <FileUp className="h-12 w-12 text-blue-500 animate-pulse" />
          <p className="mt-4 text-sm text-gray-600">
            Uploading {uploadedFile}...
          </p>
        </>
      ) : upload.isSuccess ? (
        <>
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="mt-4 text-sm text-green-700">
            Uploaded successfully — {upload.data.tracking_id}
          </p>
          <p className="mt-1 text-xs text-gray-500">Drop another file to upload</p>
        </>
      ) : upload.isError ? (
        <>
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-sm text-red-700">{upload.error.message}</p>
          <p className="mt-1 text-xs text-gray-500">Try again</p>
        </>
      ) : (
        <>
          <Upload className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">
            {isDragActive
              ? "Drop file here..."
              : "Drag & drop a document, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, TIFF, PDF — max 50 MB
          </p>
        </>
      )}
    </div>
  );
}
