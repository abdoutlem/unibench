"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronUp, Sparkles, Sliders, Filter,
  Calculator, BarChart3, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalyticsStore } from "@/store/analytics";
import { StepMetricPicker } from "./step-metric-picker";
import { StepDimensionPicker } from "./step-dimension-picker";
import { StepFilterPanel } from "./step-filter-panel";
import { StepAggregationPicker } from "./step-aggregation-picker";
import { StepChartTypePicker } from "./step-chart-type-picker";
import { Button } from "@/components/ui/button";

interface StepConfig {
  id: number;
  title: string;
  icon: React.ElementType;
  summary: () => string;
}

export function QueryBuilder() {
  const store = useAnalyticsStore();
  const [openStep, setOpenStep] = useState<number | null>(0);

  const steps: StepConfig[] = [
    {
      id: 0,
      title: "Metrics",
      icon: Sparkles,
      summary: () =>
        store.selectedMetricIds.length
          ? `${store.selectedMetricIds.length} metric${store.selectedMetricIds.length > 1 ? "s" : ""} selected`
          : "Choose metrics",
    },
    {
      id: 1,
      title: "Slice by",
      icon: Sliders,
      summary: () =>
        store.groupBy.length
          ? store.groupBy.join(", ")
          : "No grouping",
    },
    {
      id: 2,
      title: "Filters",
      icon: Filter,
      summary: () => {
        const parts: string[] = [];
        if (store.filters.fiscal_year_start || store.filters.fiscal_year_end) {
          parts.push(
            `FY ${store.filters.fiscal_year_start ?? "..."}-${store.filters.fiscal_year_end ?? "..."}`
          );
        }
        if (store.filters.entity_ids.length) {
          parts.push(`${store.filters.entity_ids.length} entities`);
        }
        return parts.length ? parts.join(", ") : "No filters";
      },
    },
    {
      id: 3,
      title: "Summarize",
      icon: Calculator,
      summary: () => {
        if (store.aggregation === "none") {
          return "None (Raw Values)";
        }
        return store.aggregation.charAt(0).toUpperCase() + store.aggregation.slice(1);
      },
    },
    {
      id: 4,
      title: "Visualize",
      icon: BarChart3,
      summary: () => {
        const labels: Record<string, string> = {
          line: "Line Chart",
          bar: "Bar Chart",
          bar_horizontal: "Horizontal Bar",
          stacked_bar: "Stacked Bar",
          area: "Area Chart",
          pie: "Pie Chart",
          donut: "Donut Chart",
          table: "Table",
        };
        return labels[store.chartType] || store.chartType;
      },
    },
  ];

  const toggleStep = (id: number) => {
    setOpenStep((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border rounded-lg bg-card divide-y">
      {steps.map((step) => {
        const Icon = step.icon;
        const isOpen = openStep === step.id;
        return (
          <div key={step.id}>
            <button
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/40 transition-colors"
              onClick={() => toggleStep(step.id)}
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {step.id + 1}
              </div>
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1">{step.title}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {step.summary()}
              </span>
              <Pencil className="h-3 w-3 text-muted-foreground/50 shrink-0 ml-1" />
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1">
                {step.id === 0 && (
                  <StepMetricPicker selected={store.selectedMetricIds} onChange={store.setMetrics} />
                )}
                {step.id === 1 && (
                  <StepDimensionPicker selected={store.groupBy} onChange={store.setGroupBy} />
                )}
                {step.id === 2 && (
                  <StepFilterPanel filters={store.filters} onChange={store.setFilters} />
                )}
                {step.id === 3 && (
                  <StepAggregationPicker selected={store.aggregation} onChange={store.setAggregation} />
                )}
                {step.id === 4 && (
                  <StepChartTypePicker
                    selected={store.chartType}
                    onChange={store.setChartType}
                    groupByCount={store.groupBy.length}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Run query button */}
      <div className="px-4 py-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={store.reset}>
          Reset
        </Button>
        <Button
          size="sm"
          onClick={store.executeQuery}
          disabled={store.selectedMetricIds.length === 0 || store.loading}
        >
          {store.loading ? "Running..." : "Run Query"}
        </Button>
      </div>
    </div>
  );
}
