"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DimensionBreakdownTableProps {
  dimensions: Record<string, string>;
  className?: string;
}

export function DimensionBreakdownTable({
  dimensions,
  className,
}: DimensionBreakdownTableProps) {
  const entries = Object.entries(dimensions);

  if (entries.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No dimensions</span>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5"
        >
          <span className="text-[10px] text-muted-foreground">
            {key.replace(/_/g, " ")}:
          </span>
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            {value}
          </Badge>
        </div>
      ))}
    </div>
  );
}
