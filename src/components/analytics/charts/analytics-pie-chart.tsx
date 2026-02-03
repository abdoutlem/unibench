"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ExploreResponse, ChartConfig, ChartType } from "@/types/analytics";
import { getColor } from "./chart-colors";
import { ChartTooltip } from "./chart-tooltip";
import { ChartLegend } from "./chart-legend";
import type { LegendItem } from "./chart-legend";

interface Props {
  data: ExploreResponse;
  config: ChartConfig;
  chartType: ChartType; // "pie" or "donut"
  height?: number;
}

export function AnalyticsPieChart({ data, config, chartType, height = 380 }: Props) {
  // Build pie data from the flat rows
  const labelCol = data.columns.find((c) => c.type === "string")?.name;
  const valueCol = data.columns.find((c) => c.name === "value")?.name || "value";

  const pieData = data.rows.map((row) => ({
    name: labelCol ? String(row[labelCol] ?? "Unknown") : "Value",
    value: Number(row[valueCol] ?? 0),
  }));

  const innerRadius = chartType === "donut" ? "55%" : 0;

  const legendItems: LegendItem[] = pieData.map((d, i) => ({
    label: d.name,
    color: getColor(i),
    value: d.value,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            label={config.showDataLabels ? ({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%` : false}
            labelLine={config.showDataLabels}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={getColor(i)} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {config.showLegend && (
        <ChartLegend items={legendItems} />
      )}
    </div>
  );
}
