"use client";

import type { ExploreResponse, ChartType, ChartConfig } from "@/types/analytics";
import { AnalyticsLineChart } from "./analytics-line-chart";
import { AnalyticsBarChart } from "./analytics-bar-chart";
import { AnalyticsStackedBarChart } from "./analytics-stacked-bar-chart";
import { AnalyticsAreaChart } from "./analytics-area-chart";
import { AnalyticsPieChart } from "./analytics-pie-chart";
import { AnalyticsTableView } from "./analytics-table-view";

interface Props {
  data: ExploreResponse;
  chartType: ChartType;
  chartConfig: ChartConfig;
  height?: number;
}

export function ChartRenderer({ data, chartType, chartConfig, height = 380 }: Props) {
  if (!data.rows.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No data to display
      </div>
    );
  }

  switch (chartType) {
    case "line":
      return <AnalyticsLineChart data={data} config={chartConfig} height={height} />;
    case "bar":
    case "bar_horizontal":
      return <AnalyticsBarChart data={data} config={chartConfig} chartType={chartType} height={height} />;
    case "stacked_bar":
      return <AnalyticsStackedBarChart data={data} config={chartConfig} height={height} />;
    case "area":
      return <AnalyticsAreaChart data={data} config={chartConfig} height={height} />;
    case "pie":
    case "donut":
      return <AnalyticsPieChart data={data} config={chartConfig} chartType={chartType} height={height} />;
    case "table":
      return <AnalyticsTableView data={data} />;
    default:
      return <AnalyticsBarChart data={data} config={chartConfig} chartType="bar" height={height} />;
  }
}
