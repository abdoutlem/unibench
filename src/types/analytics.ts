// Analytics & Reports types

export type ChartType =
  | "line"
  | "bar"
  | "bar_horizontal"
  | "stacked_bar"
  | "area"
  | "pie"
  | "donut"
  | "table";

export type AggregationType =
  | "sum"
  | "average"
  | "median"
  | "min"
  | "max"
  | "count"
  | "latest";

export interface ExploreFilters {
  entity_ids: string[];
  fiscal_year_start: number | null;
  fiscal_year_end: number | null;
  dimension_filters: Record<string, string[]>;
}

export interface ExploreRequest {
  metric_ids: string[];
  group_by: string[];
  filters: ExploreFilters;
  aggregation: AggregationType;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
}

export interface ColumnDef {
  name: string;
  type: "string" | "number" | "date";
  unit?: string;
}

export interface ExploreResponse {
  columns: ColumnDef[];
  rows: Record<string, any>[];
  total_rows: number;
  metadata: Record<string, any>;
}

export interface ChartConfig {
  showDataLabels: boolean;
  showLegend: boolean;
  showGrid: boolean;
}

export interface EntityItem {
  entity_id: string;
  entity_name: string;
  entity_type: string;
}

export interface SavedReport {
  report_id: string;
  title: string;
  description: string | null;
  tags: string[];
  query_config: ExploreRequest;
  chart_type: ChartType;
  chart_config: ChartConfig;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateReportRequest {
  title: string;
  description?: string;
  tags?: string[];
  query_config: ExploreRequest;
  chart_type: ChartType;
  chart_config?: ChartConfig;
}

export interface UpdateReportRequest {
  title?: string;
  description?: string;
  tags?: string[];
  query_config?: ExploreRequest;
  chart_type?: ChartType;
  chart_config?: ChartConfig;
}
