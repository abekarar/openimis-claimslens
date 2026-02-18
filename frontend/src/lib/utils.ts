import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.6) return "text-amber-600";
  return "text-red-600";
}

export function statusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "review_required":
      return "bg-amber-100 text-amber-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}
