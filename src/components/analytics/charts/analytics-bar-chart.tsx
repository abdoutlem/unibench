"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import type { ExploreResponse, ChartConfig, ChartType } from "@/types/analytics";
import { getColor } from "./chart-colors";
import { buildSeriesData } from "./utils";
import { ChartTooltip } from "./chart-tooltip";
import { ChartLegend, buildLegendItems } from "./chart-legend";

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
  const unit = data.columns.find((c) => c.name === "unit")?.name
    ? String(data.rows[0]?.unit ?? "")
    : undefined;

  return (
    <div>
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
          <Tooltip content={<ChartTooltip unit={unit} />} />
          {seriesKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={getColor(i)} radius={[3, 3, 0, 0]} maxBarSize={48}>
              {config.showDataLabels && <LabelList position="top" style={{ fontSize: 10 }} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      {config.showLegend && seriesKeys.length > 1 && (
        <ChartLegend items={buildLegendItems(seriesKeys, chartData)} />
      )}
    </div>
  );
}
