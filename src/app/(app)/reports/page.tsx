"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileBarChart2, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("reports");
  
  // Metabase embedding state
  const [metabaseToken, setMetabaseToken] = useState<string | null>(null);
  const [metabaseLoading, setMetabaseLoading] = useState(false);
  const [metabaseError, setMetabaseError] = useState<string | null>(null);
  const metabaseInstanceUrl = process.env.NEXT_PUBLIC_METABASE_URL || "http://localhost:3001";

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

  // Fetch Metabase embed token when BI tab is active
  useEffect(() => {
    if (activeTab === "bi" && !metabaseToken && !metabaseLoading) {
      setMetabaseLoading(true);
      setMetabaseError(null);
      
      // Set Metabase config
      if (typeof window !== "undefined" && (window as any).defineMetabaseConfig) {
        (window as any).defineMetabaseConfig({
          theme: {
            preset: "light"
          },
          isGuest: true,
          instanceUrl: metabaseInstanceUrl
        });
      }
      
      // Fetch token from backend
      apiClient.getMetabaseEmbedToken()
        .then((response) => {
          setMetabaseToken(response.token);
          setMetabaseLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching Metabase token:", error);
          setMetabaseError(error.message || "Failed to load Metabase dashboard");
          setMetabaseLoading(false);
        });
    }
  }, [activeTab, metabaseToken, metabaseLoading, metabaseInstanceUrl]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`${activeTab === "bi" ? "max-w-full px-4 py-4" : "max-w-6xl px-6 py-6"} mx-auto space-y-6`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saved analytics queries and visualizations
            </p>
          </div>
          {activeTab === "reports" && (
            <Button size="sm" onClick={() => router.push("/analytics")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Report
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reports">
              <FileBarChart2 className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="bi">
              <BarChart3 className="h-4 w-4 mr-2" />
              BI Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
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
          </TabsContent>

          {/* BI Dashboard Tab */}
          <TabsContent value="bi" className="space-y-6">
            {metabaseLoading ? (
              <div className="flex items-center justify-center py-20 border rounded-lg bg-card">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading Metabase dashboard...
                </div>
              </div>
            ) : metabaseError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-card">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-sm font-medium">Failed to Load Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {metabaseError}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  onClick={() => {
                    setMetabaseToken(null);
                    setMetabaseError(null);
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : metabaseToken ? (
              <div className="border rounded-lg bg-card overflow-hidden shadow-sm w-full">
                <div className="border-b bg-muted/40 px-4 py-3">
                  <h2 className="text-sm font-medium">Metabase Dashboard</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Interactive business intelligence dashboards and analytics
                  </p>
                </div>
                <div className="relative w-full" style={{ minHeight: "600px", height: "calc(100vh - 180px)" }}>
                  {/* Metabase Dashboard Web Component */}
                  <metabase-dashboard 
                    token={metabaseToken}
                    with-title="true"
                    with-downloads="true"
                    style={{ width: "100%", height: "100%", minHeight: "600px" }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-card">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">Metabase Dashboard Not Configured</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  To enable the BI Dashboard, configure Metabase embedding settings.
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-md text-left max-w-md space-y-3">
                  <div>
                    <p className="text-xs font-medium mb-2">Backend Configuration (.env in backend/):</p>
                    <code className="text-xs block bg-background p-2 rounded border mb-2">
                      METABASE_INSTANCE_URL=http://localhost:3001<br/>
                      METABASE_SECRET_KEY=your-secret-key-here<br/>
                      METABASE_DASHBOARD_ID=2
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Frontend Configuration (.env.local in root):</p>
                    <code className="text-xs block bg-background p-2 rounded border">
                      NEXT_PUBLIC_METABASE_URL=http://localhost:3001
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Steps:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Enable embedding in Metabase: Settings → Admin → Embedding</li>
                      <li>Copy the Embedding Secret Key from Metabase settings</li>
                      <li>Add backend env vars (METABASE_SECRET_KEY, METABASE_DASHBOARD_ID)</li>
                      <li>Add frontend env var (NEXT_PUBLIC_METABASE_URL)</li>
                      <li>Restart both backend and frontend servers</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
