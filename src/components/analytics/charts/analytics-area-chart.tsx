"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { ExploreResponse, ChartConfig } from "@/types/analytics";
import { getColor } from "./chart-colors";
import { buildSeriesData } from "./utils";
import { ChartTooltip } from "./chart-tooltip";
import { ChartLegend, buildLegendItems } from "./chart-legend";

interface Props {
  data: ExploreResponse;
  config: ChartConfig;
  height?: number;
}

export function AnalyticsAreaChart({ data, config, height = 380 }: Props) {
  const { chartData, seriesKeys, xKey } = buildSeriesData(data);
  const unit = data.columns.find((c) => c.name === "unit")?.name
    ? String(data.rows[0]?.unit ?? "")
    : undefined;

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 5 }}>
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
          <Tooltip content={<ChartTooltip unit={unit} />} />
          {seriesKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getColor(i)}
              fill={getColor(i)}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {config.showLegend && (
        <ChartLegend items={buildLegendItems(seriesKeys, chartData)} />
      )}
    </div>
  );
}
