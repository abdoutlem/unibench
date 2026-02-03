"use client";

import { cn } from "@/lib/utils";
import type { AggregationType } from "@/types/analytics";

interface Props {
  selected: AggregationType;
  onChange: (agg: AggregationType) => void;
}

const AGGREGATIONS: { value: AggregationType; label: string }[] = [
  { value: "none", label: "None (Raw Values)" },
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "median", label: "Median" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
  { value: "latest", label: "Latest" },
];

export function StepAggregationPicker({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {AGGREGATIONS.map((a) => (
        <button
          key={a.value}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium border transition-colors",
            selected === a.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-foreground"
          )}
          onClick={() => onChange(a.value)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
