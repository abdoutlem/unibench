"use client";

import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  score: number; // 0-1
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getColor(score: number) {
  if (score >= 0.8) return { bg: "bg-green-100", fill: "bg-green-500", text: "text-green-700" };
  if (score >= 0.5) return { bg: "bg-yellow-100", fill: "bg-yellow-500", text: "text-yellow-700" };
  return { bg: "bg-red-100", fill: "bg-red-500", text: "text-red-700" };
}

export function ConfidenceIndicator({
  score,
  size = "md",
  showLabel = true,
  className,
}: ConfidenceIndicatorProps) {
  const clamped = Math.max(0, Math.min(1, score));
  const pct = Math.round(clamped * 100);
  const colors = getColor(clamped);

  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2" };
  const widths = { sm: "w-12", md: "w-16", lg: "w-24" };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className={cn("rounded-full overflow-hidden", colors.bg, heights[size], widths[size])}>
        <div
          className={cn("h-full rounded-full transition-all", colors.fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-mono font-medium", colors.text)}>
          {pct}%
        </span>
      )}
    </div>
  );
}
