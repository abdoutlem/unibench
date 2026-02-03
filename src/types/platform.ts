// Platform layer types aligned with the target database schema
// Covers: Glossary, Ingestion, Extraction, Quality, Grounding, Normalization, Storage, Governance

// ===== ENHANCED GLOSSARY / METRIC DEFINITIONS =====

export type MetricValueType = "numeric" | "percentage" | "currency" | "ratio" | "count" | "text";
export type MetricAggregation = "sum" | "average" | "weighted_average" | "median" | "min" | "max" | "latest";
export type MetricStatus = "active" | "draft" | "deprecated" | "archived";
export type MetricFrequency = "annual" | "quarterly" | "monthly" | "one-time";

export interface DimensionSpec {
  dimension_name: string;
  allowed_values?: string[];
  is_required: boolean;
}

export interface ValidationRule {
  type: "range" | "non_negative" | "percentage_bound" | "year_over_year_change" | "cross_metric";
  params: Record<string, number | string>;
  error_message: string;
  severity: "error" | "warning";
}

export interface EnhancedMetricDefinition {
  metric_id: string;
  canonical_name: string;
  display_name: string;
  description: string;
  domain: string;
  unit: string;
  value_type: MetricValueType;
  default_aggregation: MetricAggregation;
  calculation_logic: string;
  valid_dimensions: DimensionSpec[];
  expected_frequency: MetricFrequency;
  owner: string;
  status: MetricStatus;
  version: string;
  semantic_variations: string[];
  validation_rules: ValidationRule[];
  created_at: string;
  updated_at: string;
}

export interface MetricAlias {
  id: string;
  metric_id: string;
  alias: string;
  source_system: string;
  confidence: number;
  is_primary: boolean;
}

// ===== ENTITIES =====

export type EntityType = "institution" | "system" | "campus" | "department";

export interface PlatformEntity {
  entity_id: string;
  entity_name: string;
  entity_type: EntityType;
  parent_entity_id?: string;
  metadata: Record<string, string | number>;
  created_at: string;
}

// ===== DIMENSIONS =====

export type DimensionType = "categorical" | "numerical" | "boolean";

export interface Dimension {
  dimension_id: string;
  dimension_name: string;
  dimension_type: DimensionType;
  allowed_values?: string[];
  created_at: string;
}

// ===== INGESTION LAYER =====

export type IngestionSourceType = "url" | "document_upload" | "api_feed" | "manual_entry";
export type IngestionStatus = "pending" | "crawling" | "converting" | "extracting" | "completed" | "failed" | "paused";

export interface PipelineStep {
  step_name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  output_summary?: string;
  error?: string;
}

export interface IngestionJob {
  id: string;
  source_type: IngestionSourceType;
  source_url?: string;
  source_document_id?: string;
  source_name: string;
  status: IngestionStatus;
  pipeline_steps: PipelineStep[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  entity_id?: string;
  entity_name?: string;
  fiscal_year?: number;
  error_message?: string;
  metrics_extracted: number;
  metrics_validated: number;
}

export interface IngestionSource {
  id: string;
  name: string;
  type: IngestionSourceType;
  url?: string;
  schedule?: string;
  last_run_at?: string;
  next_run_at?: string;
  status: "active" | "paused" | "disabled";
  entity_id?: string;
  entity_name?: string;
  metrics_count: number;
  description: string;
}

// ===== EXTRACTION LAYER =====

export type ExtractionMethodType = "rule_based" | "ai_llm" | "hybrid" | "template_match";
export type ExtractionStatus = "pending" | "in_progress" | "completed" | "failed" | "needs_review";
export type CandidateStatus = "auto_matched" | "manual_review" | "rejected" | "confirmed";

export interface ExtractionRun {
  id: string;
  ingestion_job_id: string;
  source_document_id: string;
  source_document_name: string;
  method: ExtractionMethodType;
  status: ExtractionStatus;
  started_at: string;
  completed_at?: string;
  total_candidates: number;
  matched_to_glossary: number;
  unmatched: number;
  confidence_avg: number;
  entity_name?: string;
}

export interface CandidateMetric {
  id: string;
  extraction_run_id: string;
  raw_text: string;
  raw_value: string;
  matched_metric_id?: string;
  matched_metric_name?: string;
  match_confidence: number;
  dimension_values: Record<string, string>;
  source_page?: number;
  source_context: string;
  status: CandidateStatus;
  reviewer_id?: string;
  reviewed_at?: string;
}

// ===== DATA QUALITY CHECK LAYER =====

export type QualityCheckType = "structural" | "semantic" | "temporal" | "cross_source" | "cross_metric";
export type QualityCheckSeverity = "critical" | "warning" | "info";
export type QualityCheckStatus = "pass" | "fail" | "warning" | "skipped";

export interface QualityCheck {
  id: string;
  check_type: QualityCheckType;
  check_name: string;
  description: string;
  severity: QualityCheckSeverity;
  target_metric_id?: string;
  target_metric_name?: string;
  target_entity_id?: string;
  target_entity_name?: string;
  status: QualityCheckStatus;
  result_detail: string;
  expected_value?: string;
  actual_value?: string;
  run_at: string;
  source_document_id?: string;
  observation_id?: string;
}

export interface QualityReport {
  id: string;
  entity_id?: string;
  entity_name?: string;
  fiscal_year?: number;
  run_at: string;
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  overall_score: number;
  checks: QualityCheck[];
}

// ===== SOURCE GROUNDING VERIFICATION =====

export type GroundingVerdict = "verified" | "uncertain" | "hallucination" | "needs_review";

export interface GroundingCheck {
  check_name: string;
  passed: boolean;
  detail: string;
  evidence?: string;
}

export interface GroundingVerification {
  id: string;
  observation_id: string;
  metric_id: string;
  metric_name: string;
  entity_id: string;
  entity_name: string;
  extracted_value: number;
  unit: string;
  fiscal_year: number;
  source_document_id: string;
  source_document_name: string;
  source_page?: number;
  source_text_excerpt: string;
  verification_checks: GroundingCheck[];
  overall_verdict: GroundingVerdict;
  confidence_score: number;
  verified_at: string;
  verified_by?: string;
}

// ===== NORMALIZATION LAYER =====

export type NormalizationStatus = "raw" | "normalized" | "failed" | "manual_override";

export interface NormalizationRecord {
  id: string;
  observation_id: string;
  metric_id: string;
  metric_name: string;
  entity_name: string;
  raw_value: string;
  raw_unit: string;
  normalized_value: number;
  normalized_unit: string;
  normalization_method: string;
  status: NormalizationStatus;
  notes?: string;
  normalized_at: string;
}

export interface NormalizationRule {
  id: string;
  metric_id?: string;
  metric_name?: string;
  source_unit: string;
  target_unit: string;
  conversion_formula: string;
  is_active: boolean;
}

// ===== STORAGE / METRIC OBSERVATION (FACT TABLE) =====

export type ObservationStatus = "pending" | "validated" | "approved" | "rejected";

export interface MetricObservation {
  id: string;
  metric_id: string;
  metric_name: string;
  entity_id: string;
  entity_name: string;
  value: number;
  unit: string;
  fiscal_year: number;
  dimensions: Record<string, string>;
  source_document_id?: string;
  source_document_name?: string;
  ingestion_job_id?: string;
  extraction_run_id?: string;
  quality_score?: number;
  grounding_verdict?: GroundingVerdict;
  normalization_status: NormalizationStatus;
  status: ObservationStatus;
  confidence: number;
  created_at: string;
  updated_at: string;
  valid_from: string;
  valid_to?: string;
}

// ===== GOVERNANCE =====

export type GovernanceAction = "approve" | "reject" | "request_change" | "escalate" | "comment";

export interface GovernanceReview {
  id: string;
  observation_id: string;
  metric_name: string;
  entity_name: string;
  value: number;
  unit: string;
  reviewer_id: string;
  reviewer_name: string;
  action: GovernanceAction;
  comment?: string;
  previous_status: string;
  new_status: string;
  created_at: string;
}

export interface ApprovalStep {
  order: number;
  role_required: string;
  action_required: GovernanceAction;
  auto_approve_threshold?: number;
}

export interface ApprovalChain {
  id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  is_active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, string>;
}

// ===== SOURCE DOCUMENTS (enhanced) =====

export type SourceDocumentType = "pdf" | "web" | "excel" | "image" | "api" | "word" | "powerpoint" | "csv";

export interface SourceDocument {
  source_document_id: string;
  source_type: SourceDocumentType;
  source_name: string;
  source_url?: string;
  extracted_at: string;
  raw_metadata: Record<string, string>;
}
