"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { GlossaryMetric } from "@/types";
import { apiClient } from "@/lib/api";
import { Webhook, Plus, Trash2, Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface MetricMapping {
  config_id?: string;
  raw_metric_name: string;
  metric_id: string;
  confidence: number;
}

export default function WebhookPage() {
  const [mappings, setMappings] = useState<MetricMapping[]>([]);
  const [metrics, setMetrics] = useState<GlossaryMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMapping, setEditingMapping] = useState<MetricMapping | null>(null);
  const [rawMetricName, setRawMetricName] = useState("");
  const [selectedMetricId, setSelectedMetricId] = useState("");

  useEffect(() => {
    loadMappings();
    loadMetrics();
  }, []);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMetricMappings();
      setMappings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mappings");
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await apiClient.getGlossaryMetrics();
      setMetrics(data as GlossaryMetric[]);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
  };

  const saveMapping = async () => {
    if (!rawMetricName.trim() || !selectedMetricId) {
      setError("Raw metric name and canonical metric are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingMapping?.config_id) {
        await apiClient.updateMetricMapping(editingMapping.config_id, {
          metric_id: selectedMetricId,
          confidence: 1.0,
        });
      } else {
        await apiClient.createMetricMapping({
          raw_metric_name: rawMetricName.trim(),
          metric_id: selectedMetricId,
          confidence: 1.0,
        });
      }

      setRawMetricName("");
      setSelectedMetricId("");
      setEditingMapping(null);
      await loadMappings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save mapping");
    } finally {
      setLoading(false);
    }
  };

  const deleteMapping = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;

    try {
      setLoading(true);
      await apiClient.deleteMetricMapping(configId);
      await loadMappings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete mapping");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (mapping: MetricMapping) => {
    setEditingMapping(mapping);
    setRawMetricName(mapping.raw_metric_name);
    setSelectedMetricId(mapping.metric_id);
  };

  const cancelEdit = () => {
    setEditingMapping(null);
    setRawMetricName("");
    setSelectedMetricId("");
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Webhook className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">n8n Webhook Integration</h1>
          <p className="text-muted-foreground">
            Configure metric mappings for n8n automation data
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mapping Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Metric Mapping Configuration</CardTitle>
            <CardDescription>
              Map raw metric names from n8n to canonical metrics in the glossary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raw Metric Name (from n8n)</label>
              <Input
                value={rawMetricName}
                onChange={(e) => setRawMetricName(e.target.value)}
                placeholder="e.g., number_of_full_time_non_instructional_staff"
                disabled={!!editingMapping}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Canonical Metric</label>
              <Select
                value={selectedMetricId}
                onValueChange={setSelectedMetricId}
                placeholder="Select a metric from glossary"
                options={metrics.map((m) => ({
                  value: m.id,
                  label: `${m.canonical_name} (${m.domain})`,
                }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveMapping} disabled={loading || !rawMetricName || !selectedMetricId}>
                <Save className="h-4 w-4 mr-2" />
                {editingMapping ? "Update" : "Create"} Mapping
              </Button>
              {editingMapping && (
                <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mappings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configured Mappings</span>
              <Badge variant="outline">{mappings.length}</Badge>
            </CardTitle>
            <CardDescription>
              Pre-configured mappings will be used before AI mapping
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && mappings.length === 0 ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : mappings.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No mappings configured. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {mappings.map((mapping) => {
                  const metric = metrics.find((m) => m.id === mapping.metric_id);
                  return (
                    <div
                      key={mapping.config_id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{mapping.raw_metric_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          → {metric?.canonical_name || mapping.metric_id}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(mapping)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mapping.config_id && deleteMapping(mapping.config_id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Webhook Information */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoint</CardTitle>
          <CardDescription>
            Use this endpoint in your n8n workflow to send data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Endpoint URL</label>
            <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
              POST {typeof window !== "undefined" ? window.location.origin : ""}/api/v1/webhook/n8n
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Payload Format</label>
            <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`{
  "data": [
    {
      "raw_metric_name": "number_of_full_time_non_instructional_staff",
      "dimensions": {
        "race_ethnicity": "Nonresident alien"
      },
      "value": 1102,
      "aggregation": "sum across all occupational categories and gender"
    }
  ],
  "entity_id": "entity-123",
  "source_url": "https://example.com/data",
  "observation_date": "2024-01-01"
}`}
            </pre>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">How it works:</div>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Pre-configured mappings are checked first</li>
                <li>• If no mapping exists, AI (ChatGPT) maps the metric name</li>
                <li>• If AI can't match, a new metric is auto-created</li>
                <li>• Dimension values are validated against authorized values</li>
                <li>• Observations are saved to the database</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
