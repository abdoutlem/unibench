"use client";

import { cn } from "@/lib/utils";
import type { GroundingVerdict } from "@/types/platform";

const verdictStyles: Record<GroundingVerdict, { bg: string; text: string; label: string }> = {
  verified: { bg: "bg-green-100", text: "text-green-800", label: "Verified" },
  uncertain: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Uncertain" },
  hallucination: { bg: "bg-red-100", text: "text-red-800", label: "Hallucination" },
  needs_review: { bg: "bg-orange-100", text: "text-orange-800", label: "Needs Review" },
};

interface GroundingVerdictBadgeProps {
  verdict: GroundingVerdict;
  className?: string;
}

export function GroundingVerdictBadge({ verdict, className }: GroundingVerdictBadgeProps) {
  const style = verdictStyles[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
