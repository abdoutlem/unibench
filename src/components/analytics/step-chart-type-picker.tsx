"use client";

import {
  BarChart3, LineChart as LineIcon, AreaChart as AreaIcon,
  PieChart as PieIcon, Table2, BarChartHorizontal, Layers,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartType } from "@/types/analytics";

interface Props {
  selected: ChartType;
  onChange: (type: ChartType) => void;
  groupByCount?: number;
}

const CHART_TYPES: { value: ChartType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: "bar", label: "Bar", icon: BarChart3, hint: "Compare values" },
  { value: "bar_horizontal", label: "Horizontal", icon: BarChartHorizontal, hint: "Long labels" },
  { value: "line", label: "Line", icon: LineIcon, hint: "Trends over time" },
  { value: "area", label: "Area", icon: AreaIcon, hint: "Volume over time" },
  { value: "stacked_bar", label: "Stacked", icon: Layers, hint: "Part of whole" },
  { value: "pie", label: "Pie", icon: PieIcon, hint: "Proportions" },
  { value: "donut", label: "Donut", icon: Circle, hint: "Proportions" },
  { value: "table", label: "Table", icon: Table2, hint: "Raw data" },
];

export function StepChartTypePicker({ selected, onChange, groupByCount = 0 }: Props) {
  // Recommend chart types based on dimensions
  const recommended = getRecommended(groupByCount);

  return (
    <div className="grid grid-cols-4 gap-2">
      {CHART_TYPES.map((ct) => {
        const Icon = ct.icon;
        const isRec = recommended.includes(ct.value);
        return (
          <button
            key={ct.value}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-colors text-center",
              selected === ct.value
                ? "border-primary bg-primary/8 text-primary"
                : "border-input hover:border-foreground/20 hover:bg-accent text-muted-foreground"
            )}
            onClick={() => onChange(ct.value)}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{ct.label}</span>
            {isRec && selected !== ct.value && (
              <span className="text-[9px] text-primary/70">recommended</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getRecommended(groupByCount: number): ChartType[] {
  if (groupByCount === 0) return ["bar", "table"];
  if (groupByCount === 1) return ["bar", "pie", "bar_horizontal"];
  return ["line", "stacked_bar", "bar"];
}
