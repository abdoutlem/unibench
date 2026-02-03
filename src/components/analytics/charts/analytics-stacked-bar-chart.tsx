"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LabelList,
} from "recharts";
import type { ExploreResponse, ChartConfig } from "@/types/analytics";
import { getColor } from "./chart-colors";
import { buildSeriesData } from "./utils";

interface Props {
  data: ExploreResponse;
  config: ChartConfig;
  height?: number;
}

export function AnalyticsStackedBarChart({ data, config, height = 380 }: Props) {
  const { chartData, seriesKeys, xKey } = buildSeriesData(data);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 5 }}>
        {config.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
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
        {seriesKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={getColor(i)} stackId="stack" maxBarSize={48}>
            {config.showDataLabels && <LabelList position="inside" style={{ fontSize: 10, fill: "#fff" }} />}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
