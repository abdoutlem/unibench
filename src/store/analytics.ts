import { create } from "zustand";
import type {
  ChartType,
  AggregationType,
  ExploreFilters,
  ExploreResponse,
  ChartConfig,
  SavedReport,
} from "@/types/analytics";
import { apiClient } from "@/lib/api";

interface AnalyticsState {
  // Query builder state
  selectedMetricIds: string[];
  groupBy: string[];
  filters: ExploreFilters;
  aggregation: AggregationType;
  chartType: ChartType;
  chartConfig: ChartConfig;

  // Active step in the builder (0-4)
  activeStep: number;

  // Result state
  result: ExploreResponse | null;
  loading: boolean;
  error: string | null;

  // Actions
  setMetrics: (ids: string[]) => void;
  setGroupBy: (dims: string[]) => void;
  setFilters: (filters: ExploreFilters) => void;
  setAggregation: (agg: AggregationType) => void;
  setChartType: (type: ChartType) => void;
  setChartConfig: (config: Partial<ChartConfig>) => void;
  setActiveStep: (step: number) => void;
  executeQuery: () => Promise<void>;
  loadFromReport: (report: SavedReport) => void;
  reset: () => void;
}

const defaultFilters: ExploreFilters = {
  entity_ids: [],
  fiscal_year_start: null,
  fiscal_year_end: null,
  dimension_filters: {},
};

const defaultChartConfig: ChartConfig = {
  showDataLabels: false,
  showLegend: true,
  showGrid: true,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  selectedMetricIds: [],
  groupBy: [],
  filters: { ...defaultFilters },
  aggregation: "sum",
  chartType: "bar",
  chartConfig: { ...defaultChartConfig },
  activeStep: 0,
  result: null,
  loading: false,
  error: null,

  setMetrics: (ids) => set({ selectedMetricIds: ids }),
  setGroupBy: (dims) => set({ groupBy: dims }),
  setFilters: (filters) => set({ filters }),
  setAggregation: (agg) => set({ aggregation: agg }),
  setChartType: (type) => set({ chartType: type }),
  setChartConfig: (partial) =>
    set((s) => ({ chartConfig: { ...s.chartConfig, ...partial } })),
  setActiveStep: (step) => set({ activeStep: step }),

  executeQuery: async () => {
    const state = get();
    if (state.selectedMetricIds.length === 0) {
      set({ error: "Select at least one metric" });
      return;
    }
    set({ loading: true, error: null });
    try {
      const result = await apiClient.exploreMetrics({
        metric_ids: state.selectedMetricIds,
        group_by: state.groupBy,
        filters: state.filters,
        aggregation: state.aggregation,
        sort_by: "value",
        sort_order: "desc",
        limit: 500,
      });
      set({ result, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Query failed", loading: false });
    }
  },

  loadFromReport: (report) => {
    const qc = report.query_config;
    set({
      selectedMetricIds: qc.metric_ids,
      groupBy: qc.group_by,
      filters: qc.filters,
      aggregation: qc.aggregation,
      chartType: report.chart_type,
      chartConfig: report.chart_config || { ...defaultChartConfig },
      result: null,
      error: null,
      activeStep: 0,
    });
  },

  reset: () =>
    set({
      selectedMetricIds: [],
      groupBy: [],
      filters: { ...defaultFilters },
      aggregation: "sum",
      chartType: "bar",
      chartConfig: { ...defaultChartConfig },
      activeStep: 0,
      result: null,
      loading: false,
      error: null,
    }),
}));
