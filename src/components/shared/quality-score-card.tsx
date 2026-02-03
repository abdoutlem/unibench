"use client";

import { cn } from "@/lib/utils";

interface QualityScoreCardProps {
  score: number; // 0-100
  passed: number;
  failed: number;
  warnings: number;
  label?: string;
  className?: string;
}

function getScoreColor(score: number) {
  if (score >= 90) return { ring: "text-green-500", bg: "bg-green-50" };
  if (score >= 75) return { ring: "text-yellow-500", bg: "bg-yellow-50" };
  return { ring: "text-red-500", bg: "bg-red-50" };
}

export function QualityScoreCard({
  score,
  passed,
  failed,
  warnings,
  label,
  className,
}: QualityScoreCardProps) {
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Circular score */}
      <div className="relative flex-shrink-0">
        <svg width="56" height="56" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/20"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            className={colors.ring}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono">{score}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="min-w-0">
        {label && (
          <div className="text-sm font-medium truncate">{label}</div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {passed}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {failed}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            {warnings}
          </span>
        </div>
      </div>
    </div>
  );
}
