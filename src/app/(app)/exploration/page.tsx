"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import {
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Database,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricGroup {
  group_id: string;
  canonical_name: string;
  description: string;
  unit: string;
  category: string;
  confidence: number;
  metrics: Array<{
    metric_id: string;
    canonical_name: string;
    description: string;
    unit: string;
    observation_count: number;
    is_auto_created: boolean;
  }>;
  total_observations: number;
}

export default function ExplorationPage() {
  const [groups, setGroups] = useState<MetricGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<MetricGroup | null>(null);
  const [acceptingGroupId, setAcceptingGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadDiscoveredMetrics();
  }, []);

  const loadDiscoveredMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDiscoveredMetrics();
      setGroups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load discovered metrics");
    } finally {
      setLoading(false);
    }
  };

  const acceptGroup = async (group: MetricGroup) => {
    try {
      setAcceptingGroupId(group.group_id);
      setError(null);

      await apiClient.acceptMetricGroup({
        group_id: group.group_id,
        canonical_name: editingGroup?.canonical_name || group.canonical_name,
        description: editingGroup?.description || group.description,
        unit: editingGroup?.unit || group.unit,
        category: editingGroup?.category || group.category,
      });

      // Remove accepted group from list
      setGroups(groups.filter((g) => g.group_id !== group.group_id));
      setEditingGroup(null);
      setExpandedGroup(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept metric group");
    } finally {
      setAcceptingGroupId(null);
    }
  };

  const rejectGroup = async (groupId: string) => {
    try {
      await apiClient.rejectMetricGroup(groupId);
      setGroups(groups.filter((g) => g.group_id !== groupId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject metric group");
    }
  };

  const filteredGroups = groups.filter((group) => {
    const query = searchQuery.toLowerCase();
    return (
      group.canonical_name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query) ||
      group.metrics.some((m) => m.canonical_name.toLowerCase().includes(query))
    );
  });

  const toggleExpand = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
            <Sparkles className="h-4.5 w-4.5 text-purple-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Data Exploration</h1>
            <p className="text-sm text-muted-foreground">
              Discover and curate metrics from data sources
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadDiscoveredMetrics} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search discovered metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metric Groups</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{groups.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Metrics</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">
              {groups.reduce((sum, g) => sum + g.metrics.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Observations</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">
              {groups.reduce((sum, g) => sum + g.total_observations, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Groups */}
      {loading && groups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading discovered metrics...
          </CardContent>
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {searchQuery
              ? "No metric groups found matching your search."
              : "No discovered metrics yet. Metrics will appear here after webhook data is processed."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <Card key={group.group_id}>
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold">{group.canonical_name}</h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {group.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {group.unit}
                        </Badge>
                        {group.confidence < 0.8 && (
                          <Badge variant="outline" className="text-xs text-yellow-600">
                            Low confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {group.metrics.length} metric{group.metrics.length !== 1 ? "s" : ""}
                        </span>
                        <span>
                          {group.total_observations.toLocaleString()} observation
                          {group.total_observations !== 1 ? "s" : ""}
                        </span>
                        <span>Confidence: {(group.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(group.group_id)}
                      >
                        {expandedGroup === group.group_id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedGroup === group.group_id && (
                  <div className="border-t p-4 space-y-4">
                    {/* Edit form */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Canonical Name
                        </label>
                        <Input
                          value={editingGroup?.canonical_name || group.canonical_name}
                          onChange={(e) =>
                            setEditingGroup({
                              ...(editingGroup || group),
                              canonical_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Category</label>
                        <Select
                          value={editingGroup?.category || group.category}
                          onValueChange={(v) =>
                            setEditingGroup({
                              ...(editingGroup || group),
                              category: v,
                            })
                          }
                          options={[
                            { value: "finance", label: "Finance" },
                            { value: "operations", label: "Operations" },
                            { value: "students", label: "Students" },
                            { value: "faculty", label: "Faculty" },
                            { value: "research", label: "Research" },
                            { value: "administrative_staff", label: "Administrative Staff" },
                          ]}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Unit</label>
                        <Input
                          value={editingGroup?.unit || group.unit}
                          onChange={(e) =>
                            setEditingGroup({
                              ...(editingGroup || group),
                              unit: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Description
                        </label>
                        <Textarea
                          value={editingGroup?.description || group.description}
                          onChange={(e) =>
                            setEditingGroup({
                              ...(editingGroup || group),
                              description: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Metrics in group */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Metrics in this group ({group.metrics.length}):
                      </label>
                      <div className="space-y-2">
                        {group.metrics.map((metric) => (
                          <div
                            key={metric.metric_id}
                            className="flex items-center justify-between p-2.5 rounded-md border border-border/60"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium">{metric.canonical_name}</div>
                              {metric.description && (
                                <div className="text-xs text-muted-foreground">
                                  {metric.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{metric.observation_count} obs.</span>
                              {metric.is_auto_created && (
                                <Badge variant="outline" className="text-xs">
                                  Auto-created
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={() => acceptGroup(group)}
                        disabled={acceptingGroupId === group.group_id}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept & Add to Glossary
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rejectGroup(group.group_id)}
                        disabled={acceptingGroupId === group.group_id}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
