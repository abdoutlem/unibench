"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LabelList,
} from "recharts";
import type { ExploreResponse, ChartConfig, ChartType } from "@/types/analytics";
import { getColor } from "./chart-colors";
import { buildSeriesData } from "./utils";

interface Props {
  data: ExploreResponse;
  config: ChartConfig;
  chartType: ChartType; // "bar" or "bar_horizontal"
  height?: number;
}

export function AnalyticsBarChart({ data, config, chartType, height = 380 }: Props) {
  const { chartData, seriesKeys, xKey } = buildSeriesData(data);
  const horizontal = chartType === "bar_horizontal";
  const layout = horizontal ? "vertical" as const : "horizontal" as const;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout={layout} margin={{ top: 8, right: 16, left: 8, bottom: 5 }}>
        {config.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
        )}
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={72} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)",
          }}
        />
        {config.showLegend && seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: "12px" }} />}
        {seriesKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={getColor(i)} radius={[3, 3, 0, 0]} maxBarSize={48}>
            {config.showDataLabels && <LabelList position="top" style={{ fontSize: 10 }} />}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
