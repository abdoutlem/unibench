"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalyticsStore } from "@/store/analytics";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Discrepancy {
  type: string;
  row?: number;
  analytics_value?: number;
  raw_value?: number;
  analytics_count?: number;
  raw_count?: number;
  context?: Record<string, unknown>;
}

interface ValidationData {
  match: boolean;
  discrepancies: Discrepancy[];
  raw_sql: string;
  raw_query_result: Record<string, unknown>[];
}

export function ValidationPanel() {
  const store = useAnalyticsStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasResult = store.result && store.result.rows.length > 0;
  if (!hasResult) return null;

  async function handleVerify() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiClient.validateExploreResult({
        metric_ids: store.selectedMetricIds,
        group_by: store.groupBy,
        filters: store.filters,
        aggregation: store.aggregation,
        sort_by: "value",
        sort_order: "desc",
        limit: 500,
      });
      setResult(data);
      setOpen(true);
    } catch (e: any) {
      setError(e.message || "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-2 text-sm font-medium"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <ShieldCheck className="h-4 w-4" />
          Data Verification
          {result && (
            <span className="ml-2">
              {result.match ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 inline" />
              )}
            </span>
          )}
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Data"
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Expandable content */}
      {open && result && (
        <div className="border-t px-4 py-3 space-y-3">
          {/* Status */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
              result.match
                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            )}
          >
            {result.match ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Results verified — analytics query and raw SQL match perfectly.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Discrepancies found between analytics query and raw SQL ({result.discrepancies.length}).
              </>
            )}
          </div>

          {/* Discrepancies */}
          {result.discrepancies.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Discrepancies:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.discrepancies.map((d, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-muted px-3 py-1.5 text-xs font-mono"
                  >
                    {d.type === "row_count_mismatch"
                      ? `Row count: analytics=${d.analytics_count}, raw=${d.raw_count}`
                      : `Row ${d.row}: analytics=${d.analytics_value}, raw=${d.raw_value}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw SQL */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground font-medium">
              Raw SQL query
            </summary>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
              {result.raw_sql}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
