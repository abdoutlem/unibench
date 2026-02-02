"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient, ExtractionRule, ExtractionJob } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExtractDialogProps {
  file: File | null;
  fileId?: string;  // Optional: use uploaded file ID instead of File object
  onClose: () => void;
  onSuccess?: (job: ExtractionJob) => void;
}

export function ExtractDialog({ file, fileId, onClose, onSuccess }: ExtractDialogProps) {
  const [rules, setRules] = useState<ExtractionRule[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [method, setMethod] = useState<"HYBRID" | "RULE_BASED" | "AI">("HYBRID");
  const [loading, setLoading] = useState(false);
  const [loadingRules, setLoadingRules] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<ExtractionJob | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(true); // Start in preview mode

  // Load available rules
  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoadingRules(true);
        const availableRules = await apiClient.getRules();
        setRules(availableRules.filter((r) => r.is_active));
        // Select first rule by default
        if (availableRules.length > 0) {
          setSelectedRules([availableRules[0].id]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load extraction rules");
      } finally {
        setLoadingRules(false);
      }
    };

    loadRules();
  }, []);

  const handleRuleToggle = (ruleId: string) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleExtract = async () => {
    if ((!file && !fileId) || selectedRules.length === 0) {
      setError("Please select at least one extraction rule");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let result: ExtractionJob;
      
      if (fileId) {
        // Extract from uploaded file using file_id
        const formData = new FormData();
        formData.append("rule_ids", selectedRules.join(","));
        // Convert method to lowercase: HYBRID -> hybrid, RULE_BASED -> rule_based, AI -> ai
        formData.append("method", method.toLowerCase());
        formData.append("file_id", fileId);
        formData.append("preview_only", previewOnly.toString());
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${apiUrl}/extract`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }
        
        result = await response.json();
      } else if (file) {
        // For direct file upload, we need to add preview_only to the API client
        const formData = new FormData();
        formData.append("file", file);
        formData.append("rule_ids", selectedRules.join(","));
        formData.append("method", method.toLowerCase());
        formData.append("preview_only", previewOnly.toString());
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${apiUrl}/extract`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }
        
        result = await response.json();
      } else {
        throw new Error("No file or file ID provided");
      }
      
      setJob(result);
      setShowPreview(true);
      
      // Only call onSuccess if not in preview mode (actual save)
      if (!previewOnly && onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract data from file");
    } finally {
      setLoading(false);
    }
  };

  if (!file && !fileId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Extract Data from {file?.name || `File ${fileId}`}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="font-medium">{file?.name || `File ID: ${fileId}`}</div>
              {file && (
                <div className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Extraction Method */}
          <div>
            <label className="text-sm font-medium mb-2 block">Extraction Method</label>
            <div className="flex gap-2">
              {(["HYBRID", "RULE_BASED", "AI"] as const).map((m) => (
                <Button
                  key={m}
                  variant={method === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMethod(m)}
                >
                  {m.replace("_", " ")}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {method === "HYBRID" && "Uses both rule-based and AI extraction for best results"}
              {method === "RULE_BASED" && "Uses pattern matching and regex rules only"}
              {method === "AI" && "Uses AI extraction (requires API keys configured)"}
            </p>
          </div>

          {/* Preview Mode Toggle */}
          {!showPreview && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preview-mode"
                  checked={previewOnly}
                  onChange={(e) => setPreviewOnly(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="preview-mode" className="text-sm font-medium cursor-pointer">
                  Preview mode (don't save to database)
                </label>
              </div>
              <span className="text-xs text-muted-foreground">
                Preview allows you to see extracted values before saving
              </span>
            </div>
          )}

          {/* Rules Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Extraction Rules ({selectedRules.length} selected)
            </label>
            {loadingRules ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    onClick={() => handleRuleToggle(rule.id)}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedRules.includes(rule.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRules.includes(rule.id)}
                            onChange={() => handleRuleToggle(rule.id)}
                            className="rounded"
                          />
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {rule.unit}
                          </Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Display */}
          {job && showPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {previewOnly ? "Preview - Extraction completed!" : "Extraction completed!"}
                  </span>
                  <Badge variant="outline">{job.results.length} result{job.results.length !== 1 ? 's' : ''}</Badge>
                  {job.results.some(r => r.dimensions?.geography) && (
                    <Badge variant="secondary" className="text-xs">
                      🌍 Geography data included
                    </Badge>
                  )}
                  {previewOnly && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Preview Mode
                    </Badge>
                  )}
                </div>
                {previewOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Re-run extraction without preview mode to save
                      setLoading(true);
                      try {
                        setPreviewOnly(false);
                        setShowPreview(false);
                        await handleExtract();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to save extraction");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Save These Results
                  </Button>
                )}
              </div>
              
              {job.results.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground border rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No values were extracted. Try different rules or check the document content.</p>
                </div>
              ) : (
                <>
                  {/* Results Summary */}
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Results</div>
                        <div className="font-semibold text-lg">{job.results.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">With Geography</div>
                        <div className="font-semibold text-lg">
                          {job.results.filter(r => r.dimensions?.geography).length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Confidence</div>
                        <div className="font-semibold text-lg">
                          {((job.results.reduce((sum, r) => sum + r.confidence, 0) / job.results.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Unique Locations</div>
                        <div className="font-semibold text-lg">
                          {new Set(job.results.filter(r => r.dimensions?.location).map(r => r.dimensions?.location)).size}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                  {job.results.map((result, idx) => (
                    <div
                      key={result.id}
                      className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Result header with number and geography badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="secondary" className="text-xs font-mono">
                              Result #{idx + 1}
                            </Badge>
                            {result.dimensions?.geography && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                🌍 {result.dimensions.geography}
                              </Badge>
                            )}
                            {result.dimensions?.location && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800">
                                📍 {result.dimensions.location}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-base">{result.metric_name}</div>
                            <Badge variant="outline" className="text-xs">
                              {result.unit}
                            </Badge>
                            <Badge 
                              variant={result.confidence > 0.8 ? "default" : result.confidence > 0.5 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {(result.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                            <Badge
                              variant={
                                result.status === "approved"
                                  ? "default"
                                  : result.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {result.status === "pending_review" ? "Pending Review" :
                               result.status === "approved" ? "Approved" :
                               "Rejected"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Extracted Value</span>
                              <div className="font-mono font-semibold text-lg">
                                {result.extracted_value || "N/A"}
                              </div>
                            </div>
                            {result.normalized_value !== null && (
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Normalized Value</span>
                                <div className="font-mono font-semibold text-lg">
                                  {typeof result.normalized_value === 'number' 
                                    ? result.normalized_value.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })
                                    : result.normalized_value}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Dimensions: Geography, Location, etc. */}
                          {(result.dimensions || result.fiscal_year) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {result.dimensions?.geography && (
                                <Badge variant="outline" className="text-xs">
                                  🌍 {result.dimensions.geography}
                                </Badge>
                              )}
                              {result.dimensions?.location && (
                                <Badge variant="outline" className="text-xs">
                                  📍 {result.dimensions.location}
                                </Badge>
                              )}
                              {result.fiscal_year && (
                                <Badge variant="outline" className="text-xs">
                                  📅 FY {result.fiscal_year}
                                </Badge>
                              )}
                              {result.dimensions?.period && (
                                <Badge variant="outline" className="text-xs">
                                  ⏰ {result.dimensions.period}
                                </Badge>
                              )}
                              {result.dimensions?.document_type && (
                                <Badge variant="outline" className="text-xs">
                                  📄 {result.dimensions.document_type}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {result.source && (
                            <div className="mt-3 p-3 bg-muted rounded text-xs space-y-1">
                              <div className="font-medium text-muted-foreground">Source Context:</div>
                              <div className="text-muted-foreground font-mono break-words">
                                {result.source.raw_text?.substring(0, 300) || result.source.context?.substring(0, 300) || "N/A"}
                                {(result.source.raw_text?.length || result.source.context?.length || 0) > 300 && "..."}
                              </div>
                              {result.source.matched_pattern && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <span className="text-muted-foreground">Pattern: </span>
                                  <span className="font-mono bg-background px-1 rounded">{result.source.matched_pattern}</span>
                                </div>
                              )}
                              {result.source.page && (
                                <div className="text-muted-foreground">
                                  Page: {result.source.page}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Additional metadata */}
                          {result.notes && (
                            <div className="mt-2 text-xs text-muted-foreground italic">
                              <span className="font-medium">Note: </span>
                              {result.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
              
              {previewOnly && job.results.length > 0 && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={async () => {
                      // Re-run extraction without preview mode to save
                      setLoading(true);
                      try {
                        setPreviewOnly(false);
                        setShowPreview(false);
                        await handleExtract();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to save extraction");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex-1"
                  >
                    Save These Results
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setJob(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {showPreview ? "Close" : "Cancel"}
            </Button>
            {!showPreview && (
              <Button
                onClick={handleExtract}
                disabled={loading || selectedRules.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {previewOnly ? "Preview Extraction" : "Extract & Save"}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
