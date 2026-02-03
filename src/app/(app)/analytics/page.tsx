"use client";

import { useState } from "react";
import { Save, Table2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalyticsStore } from "@/store/analytics";
import { QueryBuilder, SaveReportDialog } from "@/components/analytics";
import { ChartRenderer, ChartContainer } from "@/components/analytics/charts";
import { AnalyticsTableView } from "@/components/analytics/charts";
import { ValidationPanel } from "@/components/analytics/validation-panel";
import { Chatbot } from "@/components/analytics/chatbot";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const store = useAnalyticsStore();
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const hasResult = store.result && store.result.rows.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build queries, visualize data, and save reports
            </p>
          </div>
          {hasResult && (
            <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save as Report
            </Button>
          )}
        </div>

        {/* Query Builder */}
        <QueryBuilder />

        {/* Error state */}
        {store.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {store.error}
          </div>
        )}

        {/* Results */}
        {hasResult && store.result && (
          <div className="space-y-4">
            {/* View toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-0.5 w-fit">
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "chart"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode("chart")}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Chart
              </button>
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
            </div>

            {/* Chart or Table */}
            <div className="border rounded-lg bg-card p-6">
              <ChartContainer
                chartConfig={store.chartConfig}
                onToggleLabels={() =>
                  store.setChartConfig({ showDataLabels: !store.chartConfig.showDataLabels })
                }
                onToggleLegend={() =>
                  store.setChartConfig({ showLegend: !store.chartConfig.showLegend })
                }
              >
                {viewMode === "chart" ? (
                  <ChartRenderer
                    data={store.result}
                    chartType={store.chartType}
                    chartConfig={store.chartConfig}
                    height={420}
                  />
                ) : (
                  <AnalyticsTableView data={store.result} />
                )}
              </ChartContainer>
            </div>

            {/* Metadata */}
            <p className="text-xs text-muted-foreground">
              {store.result.total_rows} row{store.result.total_rows !== 1 ? "s" : ""} returned
              {store.result.metadata?.aggregation && (
                <> &middot; Aggregation: {store.result.metadata.aggregation === "none" ? "None (Raw Values)" : store.result.metadata.aggregation}</>
              )}
            </p>

            {/* Cross-validation */}
            <ValidationPanel />
          </div>
        )}

        {/* Empty state */}
        {!hasResult && !store.loading && !store.error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">No query results yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Select metrics, configure your query above, then click &quot;Run Query&quot; to visualize data.
            </p>
          </div>
        )}

        {/* Loading state */}
        {store.loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Running query...
            </div>
          </div>
        )}
      </div>

      <SaveReportDialog open={saveOpen} onOpenChange={setSaveOpen} />
      <Chatbot />
    </div>
  );
}
