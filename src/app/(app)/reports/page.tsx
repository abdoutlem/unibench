"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileBarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { useAnalyticsStore } from "@/store/analytics";
import { ReportCard, EditReportDialog } from "@/components/reports";
import type { SavedReport } from "@/types/analytics";

export default function ReportsPage() {
  const router = useRouter();
  const loadFromReport = useAnalyticsStore((s) => s.loadFromReport);

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editReport, setEditReport] = useState<SavedReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.listReports(search ? { search } : undefined);
      setReports(data as SavedReport[]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpen = (report: SavedReport) => {
    loadFromReport(report);
    router.push("/analytics");
  };

  const handleDuplicate = async (report: SavedReport) => {
    try {
      await apiClient.saveReport({
        title: `${report.title} (Copy)`,
        description: report.description,
        tags: report.tags,
        query_config: report.query_config,
        chart_type: report.chart_type,
        chart_config: report.chart_config,
      });
      fetchReports();
    } catch {}
  };

  const handleDelete = async (report: SavedReport) => {
    try {
      await apiClient.deleteReport(report.report_id);
      fetchReports();
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saved analytics queries and visualizations
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/analytics")}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Report
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading reports...
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && reports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <ReportCard
                key={report.report_id}
                report={report}
                onOpen={() => handleOpen(report)}
                onEdit={() => setEditReport(report)}
                onDuplicate={() => handleDuplicate(report)}
                onDelete={() => handleDelete(report)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileBarChart2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">No reports yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create your first report from the Analytics page by building a query and saving it.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/analytics")}>
              Go to Analytics
            </Button>
          </div>
        )}
      </div>

      <EditReportDialog
        report={editReport}
        open={!!editReport}
        onOpenChange={(open) => { if (!open) setEditReport(null); }}
        onSaved={fetchReports}
      />
    </div>
  );
}
