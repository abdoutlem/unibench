"use client";

import { format } from "date-fns";
import { X, Download, Trash2, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon } from "./file-icon";
import { Document, DocumentStatus } from "@/types/documents";
import { formatFileSize } from "@/data/documents";
import { metricDefinitions, getInstitutionById } from "@/data";
import { cn } from "@/lib/utils";

interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: "Pending Processing",
    icon: <Clock className="h-5 w-5" />,
    color: "text-gray-500",
  },
  processing: {
    label: "Processing",
    icon: <RefreshCw className="h-5 w-5 animate-spin" />,
    color: "text-blue-500",
  },
  completed: {
    label: "Processing Complete",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "text-green-500",
  },
  failed: {
    label: "Processing Failed",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-red-500",
  },
  needs_review: {
    label: "Needs Review",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-yellow-500",
  },
};

export function DocumentDetail({ document, onClose }: DocumentDetailProps) {
  const status = statusConfig[document.status];
  const institution = document.institutionId
    ? getInstitutionById(document.institutionId)
    : null;

  const extractedMetricDetails = document.extractedMetrics
    .map((id) => metricDefinitions.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between border-b">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <FileIcon type={document.type} size="lg" />
          </div>
          <div>
            <CardTitle className="text-lg">{document.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{formatFileSize(document.size)}</span>
              <span>·</span>
              <span>{document.type.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6 overflow-auto">
        {/* Status */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <div className={status.color}>{status.icon}</div>
          <div>
            <div className="font-medium">{status.label}</div>
            {document.status === "processing" && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-muted rounded-full w-32">
                  <div
                    className="h-2 bg-primary rounded-full transition-all"
                    style={{ width: `${document.processingProgress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {document.processingProgress}%
                </span>
              </div>
            )}
            {document.notes && (
              <p className="text-sm text-muted-foreground mt-1">{document.notes}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <h3 className="font-semibold">Document Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Uploaded</div>
              <div>{format(new Date(document.uploadedAt), "MMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Fiscal Year</div>
              <div>{document.fiscalYear ? `FY ${document.fiscalYear}` : "Not specified"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Institution</div>
              <div>{institution ? institution.shortName : "Not assigned"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Location</div>
              <div className="truncate">{document.path}</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Metrics */}
        <div className="space-y-3">
          <h3 className="font-semibold">Extracted Metrics</h3>
          {extractedMetricDetails.length > 0 ? (
            <div className="space-y-2">
              {extractedMetricDetails.map((metric) => (
                <div
                  key={metric!.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{metric!.shortName}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {metric!.category}
                    </div>
                  </div>
                  <Badge
                    variant={metric!.isInternal ? "internal" : "external"}
                    className="text-xs"
                  >
                    {metric!.isInternal ? "Internal" : "Benchmark"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 text-center">
              {document.status === "pending"
                ? "Metrics will be extracted once processing begins"
                : document.status === "processing"
                ? "Extracting metrics..."
                : "No metrics extracted from this document"}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {document.status === "failed" && (
            <Button variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
