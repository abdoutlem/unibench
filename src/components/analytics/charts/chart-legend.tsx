"use client";

import { getColor } from "./chart-colors";

export interface LegendItem {
  label: string;
  color: string;
  value?: number;
}

interface ChartLegendProps {
  items: LegendItem[];
}

/** Build legend items from series keys and chart data. */
export function buildLegendItems(
  seriesKeys: string[],
  chartData: Record<string, any>[],
): LegendItem[] {
  return seriesKeys.map((key, i) => {
    const total = chartData.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
    return {
      label: key,
      color: getColor(i),
      value: total,
    };
  });
}

export function ChartLegend({ items }: ChartLegendProps) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 pt-3 text-xs">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate max-w-[140px] text-muted-foreground">
            {item.label}
          </span>
          {item.value != null && (
            <span className="text-foreground tabular-nums font-medium">
              {item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
