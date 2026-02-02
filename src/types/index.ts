// Core entity types for the analytics platform

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  type: "public" | "private" | "for-profit";
  state: string;
  region: string;
  peerGroupIds: string[];
  isPortfolio: boolean; // true = internal, false = benchmark only
  createdAt: string;
  updatedAt: string;
}

export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  institutionCount: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  shortName: string;
  category: MetricCategory;
  description: string;
  calculationMethod: string;
  unit: MetricUnit;
  dataSource: DataSource;
  isInternal: boolean; // true = portfolio-only, false = benchmark-comparable
  version: string;
  effectiveDate: string;
  confidence: ConfidenceLevel;
}

export type MetricCategory =
  | "financial"
  | "enrollment"
  | "retention"
  | "graduation"
  | "research"
  | "faculty"
  | "facilities"
  | "endowment";

export type MetricUnit =
  | "currency"
  | "percentage"
  | "count"
  | "ratio"
  | "rank";

export type DataSource =
  | "internal-document"
  | "ipeds"
  | "common-data-set"
  | "usnews"
  | "calculated"
  | "manual-entry";

export type ConfidenceLevel = "high" | "medium" | "low" | "unverified";

export type MetricDomain =
  | "students"
  | "faculty"
  | "research"
  | "administrative_staff"
  | "operations"
  | "finance";

export interface GlossaryMetric {
  id: string;
  domain: MetricDomain;
  name: string;
  canonical_name: string;
  description: string;
  calculation_logic: string;
  data_owner: string;
  source: string;
  update_frequency: string;
  unit: string;
  semantic_variations: string[];
  validation_rules: Array<{
    type: string;
    params: Record<string, any>;
    error_message: string;
  }>;
  entities: string[];
  dimensions: string[];
  version: string;
  effective_date: string;
  is_active: boolean;
}

export interface GlossaryMatch {
  metric_id: string;
  metric_name: string;
  domain: MetricDomain;
  matched_text: string;
  confidence: number;
  matched_variation?: string;
  context?: string;
}

export interface FactMetric {
  id: string;
  entity_id: string;
  metric_id: string;
  domain: MetricDomain;
  dimension_values: Record<string, any>;
  value: number;
  unit: string;
  confidence: number;
  source_document_id?: string;
  extraction_job_id?: string;
  extracted_at: string;
  validated_at?: string;
  validation_status: string;
  notes?: string;
}

export interface ComparisonResult {
  metric_id: string;
  metric_name: string;
  domain: MetricDomain;
  data_points: FactMetric[];
  aggregated?: Record<string, any>;
  comparison_stats?: Record<string, any>;
}

export interface MetricValue {
  id: string;
  institutionId: string;
  metricId: string;
  fiscalYear: number;
  value: number;
  source: DataSource;
  confidence: ConfidenceLevel;
  notes?: string;
  validFrom: string; // bitemporal: when this value became valid
  recordedAt: string; // bitemporal: when this value was recorded
}

export interface TimeSeriesDataPoint {
  fiscalYear: number;
  value: number;
  confidence: ConfidenceLevel;
}

export interface InstitutionMetricSeries {
  institutionId: string;
  institutionName: string;
  metricId: string;
  data: TimeSeriesDataPoint[];
}

export interface ComparisonData {
  metricId: string;
  metricName: string;
  portfolioValue: number;
  benchmarkValue: number;
  percentile: number;
  variance: number;
  variancePercent: number;
}

export interface DashboardKPI {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: MetricUnit;
  trend: "up" | "down" | "stable";
  trendIsPositive: boolean;
  source: "internal" | "external";
}

export interface FilterState {
  selectedInstitutionIds: string[];
  selectedPeerGroupId: string | null;
  selectedMetricIds: string[];
  fiscalYearStart: number;
  fiscalYearEnd: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type UserRole = "admin" | "analyst" | "viewer";
