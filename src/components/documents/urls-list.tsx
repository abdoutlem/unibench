"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataSource, DataSourceStatus, UpdateFrequency } from "@/types/documents";
import {
  Globe,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
} from "lucide-react";

// Mock data - replace with real data from store/API
const mockUrls: DataSource[] = [
  {
    id: "url-1",
    name: "IPEDS Data Center",
    type: "url",
    description: "National Center for Education Statistics IPEDS data",
    status: "active",
    updateFrequency: "quarterly",
    url: "https://nces.ed.gov/ipeds/datacenter/",
    lastUpdate: "2024-01-15T10:30:00Z",
    nextUpdate: "2024-04-15T10:30:00Z",
    autoExtract: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    createdBy: "user-001",
    errorCount: 2,
    successCount: 45,
    lastSuccess: "2024-01-15T10:30:00Z",
    extractionRules: ["rule-enrollment", "rule-tuition"],
    extractionMethod: "HYBRID",
    enabled: true,
    tags: ["external", "ipeds"],
  },
  {
    id: "url-2",
    name: "University Financial Reports",
    type: "url",
    description: "Quarterly financial reports from university website",
    status: "active",
    updateFrequency: "quarterly",
    url: "https://university.edu/financial-reports",
    lastUpdate: "2024-01-10T08:00:00Z",
    nextUpdate: "2024-04-10T08:00:00Z",
    autoExtract: true,
    createdAt: "2023-08-15T00:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "user-001",
    errorCount: 0,
    successCount: 12,
    lastSuccess: "2024-01-10T08:00:00Z",
    extractionRules: ["rule-total-revenue", "rule-net-income"],
    extractionMethod: "HYBRID",
    enabled: true,
    tags: ["internal", "financial"],
  },
  {
    id: "url-3",
    name: "Common Data Set",
    type: "url",
    description: "Annual common data set from institution",
    status: "error",
    updateFrequency: "yearly",
    url: "https://university.edu/common-data-set",
    lastUpdate: "2023-09-01T12:00:00Z",
    nextUpdate: "2024-09-01T12:00:00Z",
    autoExtract: true,
    createdAt: "2023-05-01T00:00:00Z",
    updatedAt: "2024-01-05T14:20:00Z",
    createdBy: "user-001",
    errorCount: 5,
    successCount: 1,
    lastSuccess: "2023-09-01T12:00:00Z",
    lastError: "2024-01-05T14:20:00Z - Connection timeout",
    extractionRules: ["rule-enrollment", "rule-graduation-rate"],
    extractionMethod: "RULE_BASED",
    enabled: true,
    tags: ["external", "cds"],
  },
];

const statusConfig: Record<
  DataSourceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  active: { label: "Active", variant: "default", icon: CheckCircle },
  inactive: { label: "Inactive", variant: "secondary", icon: Pause },
  error: { label: "Error", variant: "destructive", icon: AlertCircle },
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  processing: { label: "Processing", variant: "secondary", icon: RefreshCw },
  paused: { label: "Paused", variant: "outline", icon: Pause },
};

const frequencyLabels: Record<UpdateFrequency, string> = {
  manual: "Manual",
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

interface UrlsListProps {
  onUrlClick?: (url: DataSource) => void;
  onConfigure?: (url: DataSource) => void;
}

export function UrlsList({ onUrlClick, onConfigure }: UrlsListProps) {
  const [urls, setUrls] = useState<DataSource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newUrlName, setNewUrlName] = useState("");
  const [newUrlDescription, setNewUrlDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load datasources on mount
  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      setIsLoading(true);
      const datasources = await apiClient.listDataSources({ type: "url" });
      // Convert backend format to frontend format
      const convertedUrls: DataSource[] = datasources.map((ds: any) => ({
        id: ds.id,
        name: ds.name,
        type: ds.type,
        description: ds.description,
        status: ds.status,
        updateFrequency: ds.update_frequency,
        lastUpdate: ds.last_update,
        nextUpdate: ds.next_update,
        autoExtract: ds.auto_extract,
        url: ds.url,
        createdAt: ds.created_at,
        updatedAt: ds.updated_at,
        createdBy: ds.created_by,
        lastSuccess: ds.last_success,
        lastError: ds.last_error,
        errorCount: ds.error_count,
        successCount: ds.success_count,
        extractionRules: ds.extraction_rules || [],
        extractionMethod: ds.extraction_method || "HYBRID",
        enabled: ds.enabled,
        tags: ds.tags || [],
        notes: ds.notes,
      }));
      setUrls(convertedUrls);
    } catch (err) {
      console.error("Error loading datasources:", err);
      // Fallback to mock data if API fails
      setUrls(mockUrls);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUrls = urls.filter(
    (url) =>
      url.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search URLs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Globe className="h-4 w-4 mr-2" />
          Add URL Source
        </Button>
      </div>

      {/* URLs table */}
      <Card>
        <CardHeader>
          <CardTitle>URL Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading datasources...</span>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update Frequency</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Next Update</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUrls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No URL sources found. Add your first URL source to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUrls.map((url) => {
                  const statusInfo = statusConfig[url.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  const successRate =
                    url.successCount + url.errorCount > 0
                      ? Math.round(
                          (url.successCount / (url.successCount + url.errorCount)) * 100
                        )
                      : 0;

                  return (
                    <TableRow
                      key={url.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => onUrlClick?.(url)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{url.name}</span>
                          {url.description && (
                            <span className="text-sm text-muted-foreground">
                              {url.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {url.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{frequencyLabels[url.updateFrequency]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(url.lastUpdate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(url.nextUpdate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{successRate}%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                successRate >= 90
                                  ? "bg-green-500"
                                  : successRate >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onConfigure?.(url)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Update Now
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {url.enabled ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Add URL Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add URL Source</DialogTitle>
            <DialogDescription>
              Add a URL to process through n8n and extract metrics. The URL will be fetched and processed automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL *</label>
              <Input
                type="url"
                placeholder="https://example.com/data-source"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (Optional)</label>
              <Input
                placeholder="e.g., IPEDS Data Center"
                value={newUrlName}
                onChange={(e) => setNewUrlName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="Brief description of this data source"
                value={newUrlDescription}
                onChange={(e) => setNewUrlDescription(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewUrl("");
                setNewUrlName("");
                setNewUrlDescription("");
                setError(null);
                setSuccess(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newUrl.trim()) {
                  setError("URL is required");
                  return;
                }

                try {
                  setIsProcessing(true);
                  setError(null);
                  setSuccess(null);

                  console.log("Processing URL:", newUrl.trim());
                  const result = await apiClient.processUrl(
                    newUrl.trim(),
                    newUrlName || undefined,
                    newUrlDescription || undefined
                  );
                  console.log("URL processing result:", result);

                  // Show success if we get 202 Accepted with source_id (or 200 with success status)
                  if ((result.status === "accepted" || result.status === "success") && (result.source_id || result.datasource_id)) {
                    const sourceId = result.source_id || result.datasource_id;
                    setSuccess(
                      `URL datasource created successfully! Source ID: ${sourceId}. Processing will be handled by external system.`
                    );

                    // Reload datasources to get the new one
                    await loadDataSources();

                    // Close dialog after 2 seconds
                    setTimeout(() => {
                      setShowAddDialog(false);
                      setNewUrl("");
                      setNewUrlName("");
                      setNewUrlDescription("");
                      setError(null);
                      setSuccess(null);
                    }, 2000);
                  } else {
                    // Handle different error cases with more detail
                    let errorMessage = "Failed to process URL";
                    if (result.message) {
                      errorMessage = result.message;
                    } else if (result.result) {
                      if (result.result.error) {
                        errorMessage = `Error: ${result.result.error}`;
                      } else if (result.result.status === "timeout") {
                        errorMessage = "Request timed out. Please try again.";
                      } else if (result.result.status === "error") {
                        errorMessage = "An error occurred while processing the URL.";
                      }
                    } else if (result.status === "error") {
                      errorMessage = "Failed to process URL.";
                    } else if (!result.source_id && !result.datasource_id) {
                      errorMessage = "Failed to create datasource. No source ID returned.";
                    }
                    setError(errorMessage);
                  }
                } catch (e) {
                  console.error("Error processing URL:", e);
                  const errorMessage = e instanceof Error ? e.message : "Failed to process URL";
                  setError(errorMessage);
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing || !newUrl.trim()}
            >
              {isProcessing ? "Processing..." : "Add & Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
