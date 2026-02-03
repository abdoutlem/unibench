"use client";

import { useMemo } from "react";
import type { ExploreResponse, ChartType, ChartConfig } from "@/types/analytics";
import { decomposeData } from "./utils";
import { ChartRenderer } from "./chart-renderer";

interface ChartGridProps {
  data: ExploreResponse;
  chartType: ChartType;
  chartConfig: ChartConfig;
  height?: number;
}

export function ChartGrid({ data, chartType, chartConfig, height = 420 }: ChartGridProps) {
  const decomposed = useMemo(() => decomposeData(data), [data]);

  if (decomposed.mode === "single") {
    return <ChartRenderer data={data} chartType={chartType} chartConfig={chartConfig} height={height} />;
  }

  const facetHeight = 280;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {decomposed.facets.length} chart{decomposed.facets.length !== 1 ? "s" : ""}, split by{" "}
        <span className="font-medium text-foreground">{decomposed.facetColumn}</span>
      </p>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${decomposed.gridCols}, minmax(0, 1fr))`,
        }}
      >
        {decomposed.facets.map((facet) => (
          <div
            key={facet.label}
            className="rounded-lg border bg-card/50 p-3"
          >
            <p className="text-xs font-medium text-foreground mb-2 truncate" title={facet.label}>
              {facet.label}
            </p>
            <ChartRenderer
              data={facet.data}
              chartType={chartType}
              chartConfig={chartConfig}
              height={facetHeight}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
