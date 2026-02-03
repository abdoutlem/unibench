"use client";

import { cn } from "@/lib/utils";

const defaultColorMap: Record<string, string> = {
  completed: "bg-green-500",
  pass: "bg-green-500",
  verified: "bg-green-500",
  approved: "bg-green-500",
  active: "bg-green-500",
  running: "bg-blue-500",
  in_progress: "bg-blue-500",
  processing: "bg-blue-500",
  crawling: "bg-blue-500",
  extracting: "bg-blue-500",
  converting: "bg-blue-500",
  pending: "bg-gray-400",
  skipped: "bg-gray-400",
  draft: "bg-gray-400",
  paused: "bg-yellow-500",
  warning: "bg-yellow-500",
  uncertain: "bg-yellow-500",
  needs_review: "bg-orange-500",
  manual_review: "bg-orange-500",
  failed: "bg-red-500",
  rejected: "bg-red-500",
  hallucination: "bg-red-500",
  disabled: "bg-gray-300",
};

const pulseStatuses = new Set([
  "running",
  "in_progress",
  "processing",
  "crawling",
  "extracting",
  "converting",
]);

interface StatusDotProps {
  status: string;
  colorMap?: Record<string, string>;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusDot({
  status,
  colorMap,
  size = "md",
  className,
}: StatusDotProps) {
  const colors = { ...defaultColorMap, ...colorMap };
  const color = colors[status] || "bg-gray-400";
  const shouldPulse = pulseStatuses.has(status);

  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      {shouldPulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            color
          )}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", sizeClasses[size], color)}
      />
    </span>
  );
}
