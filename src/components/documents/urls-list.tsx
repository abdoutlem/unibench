"use client";

import { useState } from "react";
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
import { AlertCircle, CheckCircle } from "lucide-react";
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
  const [urls, setUrls] = useState<DataSource[]>(mockUrls);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newUrlName, setNewUrlName] = useState("");
  const [newUrlDescription, setNewUrlDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredUrls = urls.filter(
    (url) =>
      url.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                  const statusInfo = statusConfig[url.status];
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

                  const result = await apiClient.processUrl(newUrl.trim());

                  if (result.status === "success") {
                    setSuccess(
                      `Successfully processed URL! ${result.observations_processed || 0} observations processed.`
                    );

                    // Add to URLs list
                    const newDataSource: DataSource = {
                      id: `url-${Date.now()}`,
                      name: newUrlName || newUrl,
                      type: "url",
                      description: newUrlDescription || undefined,
                      status: "active",
                      updateFrequency: "manual",
                      url: newUrl,
                      lastUpdate: new Date().toISOString(),
                      nextUpdate: undefined,
                      autoExtract: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      createdBy: "current-user",
                      errorCount: result.observations_failed || 0,
                      successCount: result.observations_processed || 0,
                      lastSuccess: new Date().toISOString(),
                      extractionRules: [],
                      extractionMethod: "HYBRID",
                      enabled: true,
                      tags: [],
                    };

                    setUrls([...urls, newDataSource]);

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
                    setError(result.message || "Failed to process URL");
                  }
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to process URL");
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
