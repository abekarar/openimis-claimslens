import { cn, confidenceColor } from "@/lib/utils";

export function ConfidenceBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const pct = Math.round(value * 100);
  const barColor =
    value >= 0.9
      ? "bg-green-500"
      : value >= 0.6
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-600 w-32 shrink-0">{label}</span>}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-sm font-medium w-12 text-right", confidenceColor(value))}>
        {pct}%
      </span>
    </div>
  );
}
