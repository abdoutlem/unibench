/**
 * API client for UniBench backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ExtractionRule {
  id: string;
  name: string;
  description?: string;
  target_metric_id: string;
  target_metric_name: string;
  unit: string;
  extraction_method: "HYBRID" | "RULE_BASED" | "AI";
  is_active: boolean;
}

export interface ExtractionResult {
  id: string;
  job_id: string;
  document_id: string;
  document_name: string;
  rule_id: string;
  metric_id: string;
  metric_name: string;
  extracted_value: string | null;
  normalized_value: number | null;
  unit: string;
  confidence: number;
  status: "pending_review" | "approved" | "rejected";
  source?: {
    context: string;
    matched_pattern: string;
    raw_text: string;
    page?: number;
  };
  notes?: string;
  fiscal_year?: number;
  dimensions?: {
    geography?: string;
    location?: string;
    document_type?: string;
    period?: string;
    [key: string]: any; // Allow additional dimensions
  };
}

export interface ExtractionJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  document_ids: string[];
  rule_ids: string[];
  method: "HYBRID" | "RULE_BASED" | "AI";
  results: ExtractionResult[];
  errors?: Array<{ document_id: string; message: string }>;
  started_at?: string;
  completed_at?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:65',message:'API request starting',data:{url,endpoint,method:options.method||'GET'},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:73',message:'API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:76',message:'API request failed',data:{status:response.status,error:error.detail||response.statusText,endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * List all available extraction rules
   */
  async getRules(): Promise<ExtractionRule[]> {
    return this.request<ExtractionRule[]>("/rules");
  }

  /**
   * Get a specific extraction rule
   */
  async getRule(ruleId: string): Promise<ExtractionRule> {
    return this.request<ExtractionRule>(`/rules/${ruleId}`);
  }

  /**
   * Extract data from a file
   */
  async extractFromFile(
    file: File,
    ruleIds: string[],
    method: "HYBRID" | "RULE_BASED" | "AI" = "HYBRID"
  ): Promise<ExtractionJob> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("rule_ids", ruleIds.join(","));
    // Convert method to lowercase to match backend enum values: HYBRID -> hybrid, RULE_BASED -> rule_based, AI -> ai
    const methodValue = method.toLowerCase();
    formData.append("method", methodValue);

    return this.request<ExtractionJob>("/extract", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Glossary API methods
   */
  async getGlossaryMetrics(domain?: string): Promise<any[]> {
    const params = domain ? `?domain=${domain}` : "";
    return this.request<any[]>(`/glossary/metrics${params}`);
  }

  async getGlossaryMetric(metricId: string): Promise<any> {
    return this.request<any>(`/glossary/metrics/${metricId}`);
  }

  async createGlossaryMetric(metric: any): Promise<any> {
    return this.request<any>("/glossary/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metric),
    });
  }

  async updateGlossaryMetric(metricId: string, metric: any): Promise<any> {
    return this.request<any>(`/glossary/metrics/${metricId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metric),
    });
  }

  async deleteGlossaryMetric(metricId: string): Promise<{ status: string; metric_id: string }> {
    return this.request(`/glossary/metrics/${metricId}`, {
      method: "DELETE",
    });
  }

  async matchGlossaryText(
    text: string,
    domain?: string,
    limit: number = 10
  ): Promise<any[]> {
    const params = new URLSearchParams({ text, limit: limit.toString() });
    if (domain) params.append("domain", domain);
    return this.request<any[]>(`/glossary/match?${params}`);
  }

  async getGlossaryDimensions(): Promise<any[]> {
    return this.request<any[]>("/glossary/dimensions");
  }

  async getGlossaryDimension(dimensionId: string): Promise<any> {
    return this.request<any>(`/glossary/dimensions/${dimensionId}`);
  }

  async updateGlossaryDimension(dimensionId: string, dimension: any): Promise<any> {
    return this.request<any>(`/glossary/dimensions/${dimensionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dimension),
    });
  }

  /**
   * Data query API methods
   */
  async queryFacts(params: {
    metricIds?: string[];
    entityIds?: string[];
    domain?: string;
    fiscalYears?: number[];
    fiscalYearStart?: number;
    fiscalYearEnd?: number;
    includePending?: boolean;
    limit?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params.metricIds) queryParams.append("metric_ids", params.metricIds.join(","));
    if (params.entityIds) queryParams.append("entity_ids", params.entityIds.join(","));
    if (params.domain) queryParams.append("domain", params.domain);
    if (params.fiscalYears) queryParams.append("fiscal_years", params.fiscalYears.join(","));
    if (params.fiscalYearStart) queryParams.append("fiscal_year_start", params.fiscalYearStart.toString());
    if (params.fiscalYearEnd) queryParams.append("fiscal_year_end", params.fiscalYearEnd.toString());
    if (params.includePending) queryParams.append("include_pending", "true");
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    return this.request<any[]>(`/data/facts?${queryParams}`);
  }

  async compareMetrics(params: {
    metricIds: string[];
    entityIds?: string[];
    fiscalYears?: number[];
    groupBy?: string[];
  }): Promise<any[]> {
    const queryParams = new URLSearchParams({
      metric_ids: params.metricIds.join(","),
    });
    if (params.entityIds) queryParams.append("entity_ids", params.entityIds.join(","));
    if (params.fiscalYears) queryParams.append("fiscal_years", params.fiscalYears.join(","));
    if (params.groupBy) queryParams.append("group_by", params.groupBy.join(","));
    
    return this.request<any[]>(`/data/compare?${queryParams}`);
  }

  async getTimeseries(params: {
    metricId: string;
    entityId?: string;
    fiscalYearStart?: number;
    fiscalYearEnd?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams({ metric_id: params.metricId });
    if (params.entityId) queryParams.append("entity_id", params.entityId);
    if (params.fiscalYearStart) queryParams.append("fiscal_year_start", params.fiscalYearStart.toString());
    if (params.fiscalYearEnd) queryParams.append("fiscal_year_end", params.fiscalYearEnd.toString());
    
    return this.request<any[]>(`/data/timeseries?${queryParams}`);
  }

  async getFactsByDomain(domain: string): Promise<any[]> {
    return this.request<any[]>(`/data/domains/${domain}`);
  }

  /**
   * Create an extraction job
   */
  async createJob(
    documentIds: string[],
    ruleIds: string[],
    method: "HYBRID" | "RULE_BASED" | "AI" = "HYBRID",
    templateId?: string
  ): Promise<ExtractionJob> {
    return this.request<ExtractionJob>("/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_ids: documentIds,
        rule_ids: ruleIds,
        method,
        template_id: templateId,
      }),
    });
  }

  /**
   * Run an extraction job
   */
  async runJob(jobId: string): Promise<ExtractionJob> {
    return this.request<ExtractionJob>(`/jobs/${jobId}/run`, {
      method: "POST",
    });
  }

  /**
   * Get extraction job details
   */
  async getJob(jobId: string): Promise<ExtractionJob> {
    return this.request<ExtractionJob>(`/jobs/${jobId}`);
  }

  /**
   * List extraction results
   */
  async getResults(jobId?: string, status?: string): Promise<ExtractionResult[]> {
    const params = new URLSearchParams();
    if (jobId) params.append("job_id", jobId);
    if (status) params.append("status", status);
    
    const query = params.toString();
    return this.request<ExtractionResult[]>(`/results${query ? `?${query}` : ""}`);
  }

  /**
   * Review and approve/reject a result
   */
  async reviewResult(
    resultId: string,
    status: "approved" | "rejected",
    notes?: string,
    modifiedValue?: number
  ): Promise<ExtractionResult> {
    return this.request<ExtractionResult>(`/results/${resultId}/review`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        notes,
        modified_value: modifiedValue,
      }),
    });
  }

  /**
   * Upload a file to the server
   */
  async uploadFile(
    file: File,
    folderId?: string
  ): Promise<UploadedFile> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:274',message:'uploadFile called',data:{filename:file.name,size:file.size,hasFolderId:!!folderId},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folder_id", folderId);
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:281',message:'FormData created, about to send request',data:{endpoint:'/upload',hasFile:true,hasFolderId:!!folderId},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    try {
      const result = await this.request<UploadedFile>("/upload", {
        method: "POST",
        body: formData,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:290',message:'Upload successful',data:{fileId:result.id,filename:result.filename},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1295256a-3956-4b3e-9133-df5a5a55781f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:293',message:'Upload failed',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'upload-debug',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    folderId?: string
  ): Promise<UploadedFile[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (folderId) {
      formData.append("folder_id", folderId);
    }

    return this.request<UploadedFile[]>("/upload/batch", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get uploaded file metadata
   */
  async getUploadedFile(fileId: string): Promise<UploadedFile> {
    return this.request<UploadedFile>(`/upload/${fileId}`);
  }

  /**
   * List uploaded files
   */
  async listUploadedFiles(folderId?: string): Promise<UploadedFile[]> {
    const query = folderId ? `?folder_id=${folderId}` : "";
    return this.request<UploadedFile[]>(`/upload${query}`);
  }

  /**
   * Delete an uploaded file
   */
  async deleteUploadedFile(fileId: string): Promise<{ status: string; file_id: string }> {
    return this.request(`/upload/${fileId}`, {
      method: "DELETE",
    });
  }

  /**
   * Process URL through n8n
   */
  async processUrl(url: string, entityId?: string): Promise<any> {
    const formData = new FormData();
    formData.append("url", url);
    if (entityId) {
      formData.append("entity_id", entityId);
    }
    return this.request<any>("/upload/url", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Webhook API methods
   */
  async submitN8NWebhook(payload: {
    data: Array<{
      raw_metric_name: string;
      dimensions: Record<string, string>;
      value: number;
      aggregation: string;
    }>;
    entity_id: string;
    source_url?: string;
    observation_date?: string;
    source_name?: string;
  }): Promise<any> {
    return this.request<any>("/webhook/n8n", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async getMetricMappings(): Promise<any[]> {
    return this.request<any[]>("/webhook/mappings");
  }

  async createMetricMapping(mapping: {
    raw_metric_name: string;
    metric_id: string;
    confidence?: number;
  }): Promise<any> {
    return this.request<any>("/webhook/mappings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapping),
    });
  }

  async updateMetricMapping(
    configId: string,
    mapping: {
      metric_id: string;
      confidence?: number;
    }
  ): Promise<any> {
    return this.request<any>(`/webhook/mappings/${configId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapping),
    });
  }

  async deleteMetricMapping(configId: string): Promise<{ status: string; config_id: string }> {
    return this.request(`/webhook/mappings/${configId}`, {
      method: "DELETE",
    });
  }

  /**
   * Data exploration API methods
   */
  async getDiscoveredMetrics(): Promise<any[]> {
    return this.request<any[]>("/exploration/discovered-metrics");
  }

  async acceptMetricGroup(group: {
    group_id: string;
    canonical_name: string;
    description: string;
    unit: string;
    category: string;
    domain?: string;
  }): Promise<any> {
    return this.request<any>("/exploration/accept-metric-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(group),
    });
  }

  async rejectMetricGroup(groupId: string): Promise<any> {
    return this.request(`/exploration/reject-metric-group/${groupId}`, {
      method: "DELETE",
    });
  }

  // ── Analytics ──

  async exploreMetrics(query: any): Promise<any> {
    return this.request<any>("/analytics/explore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
  }

  async getEntities(): Promise<any[]> {
    return this.request<any[]>("/analytics/entities");
  }

  async getDimensionValues(dimensionName: string): Promise<string[]> {
    return this.request<string[]>(
      `/analytics/dimension-values?dimension_name=${encodeURIComponent(dimensionName)}`
    );
  }

  // ── Metabase ──

  async getMetabaseEmbedToken(dashboardId?: number): Promise<{
    token: string;
    dashboard_id: number;
    expires_in: number;
    instance_url: string;
  }> {
    const params = dashboardId ? `?dashboard_id=${dashboardId}` : "";
    return this.request<{
      token: string;
      dashboard_id: number;
      expires_in: number;
      instance_url: string;
    }>(`/metabase/embed-token${params}`);
  }

  // ── Reports ──

  async saveReport(report: any): Promise<any> {
    return this.request<any>("/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
  }

  async listReports(params?: { search?: string }): Promise<any[]> {
    const qp = new URLSearchParams();
    if (params?.search) qp.append("search", params.search);
    const qs = qp.toString();
    return this.request<any[]>(`/reports${qs ? `?${qs}` : ""}`);
  }

  async getReport(reportId: string): Promise<any> {
    return this.request<any>(`/reports/${reportId}`);
  }

  async updateReport(reportId: string, updates: any): Promise<any> {
    return this.request<any>(`/reports/${reportId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.request(`/reports/${reportId}`, { method: "DELETE" });
  }
}

export interface UploadedFile {
  id: string;
  filename: string;
  file_type: string;
  size: number;
  upload_path: string;
  uploaded_at: string;
  status: string;
}

export const apiClient = new ApiClient();
