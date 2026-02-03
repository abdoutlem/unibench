"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataSource, DataSourceStatus, UpdateFrequency } from "@/types/documents";
import {
  X,
  Globe,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Tag,
  FileText,
  Play,
  Pause,
} from "lucide-react";

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

interface DataSourceDetailProps {
  dataSource: DataSource;
  onClose: () => void;
  onConfigure?: () => void;
}

export function DataSourceDetail({ dataSource, onClose, onConfigure }: DataSourceDetailProps) {
  const statusInfo = statusConfig[dataSource.status];
  const StatusIcon = statusInfo.icon;
  const successRate =
    dataSource.successCount + dataSource.errorCount > 0
      ? Math.round(
          (dataSource.successCount / (dataSource.successCount + dataSource.errorCount)) * 100
        )
      : 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{dataSource.name}</CardTitle>
              <Badge variant={statusInfo.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <CardDescription>{dataSource.description || "No description"}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium capitalize">{dataSource.type}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <Badge variant={statusInfo.variant} className="gap-1 mt-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            {dataSource.url && (
              <div className="col-span-2">
                <div className="text-muted-foreground">URL</div>
                <a
                  href={dataSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {dataSource.url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Update Configuration */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Update Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Update Frequency</div>
              <div className="font-medium">{frequencyLabels[dataSource.updateFrequency]}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Auto Extract</div>
              <Badge variant={dataSource.autoExtract ? "default" : "secondary"} className="mt-1">
                {dataSource.autoExtract ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Last Update</div>
              <div className="font-medium">{formatDate(dataSource.lastUpdate)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Next Update</div>
              <div className="font-medium">{formatDate(dataSource.nextUpdate)}</div>
            </div>
          </div>
        </div>

        {/* Extraction Configuration */}
        {dataSource.extractionRules && dataSource.extractionRules.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Extraction Configuration</h3>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-muted-foreground">Extraction Method</div>
                <Badge variant="outline" className="mt-1">
                  {dataSource.extractionMethod || "HYBRID"}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Extraction Rules</div>
                <div className="flex flex-wrap gap-2">
                  {dataSource.extractionRules.map((rule) => (
                    <Badge key={rule} variant="secondary">
                      {rule}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Statistics</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Success Rate</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium">{successRate}%</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-24">
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
            </div>
            <div>
              <div className="text-muted-foreground">Total Updates</div>
              <div className="font-medium">
                {dataSource.successCount + dataSource.errorCount}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Successful</div>
              <div className="font-medium text-green-600">{dataSource.successCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Failed</div>
              <div className="font-medium text-red-600">{dataSource.errorCount}</div>
            </div>
            {dataSource.lastSuccess && (
              <div>
                <div className="text-muted-foreground">Last Success</div>
                <div className="font-medium">{formatDate(dataSource.lastSuccess)}</div>
              </div>
            )}
            {dataSource.lastError && (
              <div>
                <div className="text-muted-foreground">Last Error</div>
                <div className="font-medium text-red-600">{formatDate(dataSource.lastError)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {dataSource.tags && dataSource.tags.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {dataSource.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {dataSource.notes && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="text-sm text-muted-foreground">{dataSource.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onConfigure}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
