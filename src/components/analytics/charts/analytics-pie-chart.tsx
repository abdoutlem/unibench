"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ExploreResponse, ChartConfig, ChartType } from "@/types/analytics";
import { getColor } from "./chart-colors";

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

  return (
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
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)",
          }}
        />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: "12px" }} />}
      </PieChart>
    </ResponsiveContainer>
  );
}
