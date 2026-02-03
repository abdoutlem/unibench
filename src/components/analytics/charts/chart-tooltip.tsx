"use client";

import { getColor } from "./chart-colors";

interface TooltipPayloadEntry {
  name: string;
  value: number;
  dataKey: string;
  color?: string;
  payload?: Record<string, any>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  unit?: string;
}

export function ChartTooltip({ active, payload, label, unit }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      {label != null && (
        <p className="font-semibold text-foreground mb-1">{label}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={entry.dataKey ?? i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color ?? getColor(i) }}
              />
              <span className="truncate max-w-[140px]">{entry.name}</span>
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : entry.value}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
