"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { metricDefinitions, peerGroups } from "@/data";
import { GlossaryMetric, MetricCategory, MetricDomain } from "@/types";
import {
  BookOpen,
  Search,
  Calculator,
  Database,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

const categories: { id: MetricCategory; label: string; icon: React.ReactNode }[] = [
  { id: "financial", label: "Financial", icon: <Calculator className="h-4 w-4" /> },
  { id: "enrollment", label: "Enrollment", icon: <Database className="h-4 w-4" /> },
  { id: "retention", label: "Retention", icon: <Database className="h-4 w-4" /> },
  { id: "graduation", label: "Graduation", icon: <Database className="h-4 w-4" /> },
  { id: "research", label: "Research", icon: <FileText className="h-4 w-4" /> },
  { id: "faculty", label: "Faculty", icon: <Database className="h-4 w-4" /> },
  { id: "facilities", label: "Facilities", icon: <Database className="h-4 w-4" /> },
  { id: "endowment", label: "Endowment", icon: <Calculator className="h-4 w-4" /> },
];

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("metrics");

  // --- Manage tab (backend glossary) ---
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSearch, setManageSearch] = useState("");
  const [manageDomain, setManageDomain] = useState<MetricDomain | "">("");
  const [manageMetrics, setManageMetrics] = useState<GlossaryMetric[]>([]);
  const [editing, setEditing] = useState<GlossaryMetric | null>(null);
  const [variationDraft, setVariationDraft] = useState("");
  const [dimensionDraft, setDimensionDraft] = useState("");
  const [availableDimensions, setAvailableDimensions] = useState<Array<{ id: string; name: string; description?: string; type?: string; values?: string[] | null }>>([]);
  
  // --- Dimensions management ---
  const [editingDimension, setEditingDimension] = useState<{ id: string; name: string; description: string; type: string; values: string[] | null } | null>(null);
  const [dimensionValueDraft, setDimensionValueDraft] = useState("");

  const domainOptions = useMemo(
    () => [
      { value: "students", label: "Students" },
      { value: "faculty", label: "Faculty" },
      { value: "research", label: "Research" },
      { value: "administrative_staff", label: "Administrative Staff" },
      { value: "operations", label: "Operations" },
      { value: "finance", label: "Finance" },
    ],
    []
  );

  const newMetricTemplate = useMemo<GlossaryMetric>(
    () => ({
      id: "",
      domain: "students",
      name: "",
      canonical_name: "",
      description: "",
      calculation_logic: "",
      data_owner: "",
      source: "internal-document",
      update_frequency: "annual",
      unit: "count",
      semantic_variations: [],
      validation_rules: [],
      entities: ["Institution"],
      dimensions: ["FiscalYear", "DocumentType"],
      version: "1.0",
      effective_date: new Date().toISOString().slice(0, 10),
      is_active: true,
    }),
    []
  );

  const generateMetricId = (name: string) => {
    const slug = (name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return slug ? `metric-${slug}` : "";
  };

  const loadManageMetrics = async () => {
    try {
      setManageLoading(true);
      setManageError(null);
      const raw = await apiClient.getGlossaryMetrics(manageDomain || undefined);
      setManageMetrics(raw as GlossaryMetric[]);
    } catch (e) {
      setManageError(e instanceof Error ? e.message : "Failed to load glossary metrics");
    } finally {
      setManageLoading(false);
    }
  };

  const loadDimensions = async () => {
    try {
      const dims = await apiClient.getGlossaryDimensions();
      setAvailableDimensions(dims.map((d: any) => ({ 
        id: d.id, 
        name: d.name,
        description: d.description || "",
        type: d.type || "categorical",
        values: d.values || null
      })));
    } catch (e) {
      console.error("Failed to load dimensions:", e);
      setManageError(e instanceof Error ? e.message : "Failed to load dimensions");
    }
  };

  useEffect(() => {
    if (activeTab === "manage") {
      loadManageMetrics();
      loadDimensions();
    } else if (activeTab === "dimensions") {
      loadDimensions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, manageDomain]);

  const filteredManageMetrics = useMemo(() => {
    const q = manageSearch.trim().toLowerCase();
    if (!q) return manageMetrics;
    return manageMetrics.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.canonical_name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.semantic_variations || []).some((v) => v.toLowerCase().includes(q))
      );
    });
  }, [manageMetrics, manageSearch]);

  const startCreate = () => {
    setEditing({ ...newMetricTemplate });
    setVariationDraft("");
    setDimensionDraft("");
  };

  const startEdit = (metric: GlossaryMetric) => {
    setEditing({ ...metric });
    setVariationDraft("");
    setDimensionDraft("");
  };

  const addVariation = () => {
    if (!editing) return;
    const v = variationDraft.trim();
    if (!v) return;
    if ((editing.semantic_variations || []).some((x) => x.toLowerCase() === v.toLowerCase())) {
      setVariationDraft("");
      return;
    }
    setEditing({
      ...editing,
      semantic_variations: [...(editing.semantic_variations || []), v],
    });
    setVariationDraft("");
  };

  const removeVariation = (v: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      semantic_variations: (editing.semantic_variations || []).filter((x) => x !== v),
    });
  };

  const addDimension = () => {
    if (!editing) return;
    const d = dimensionDraft.trim();
    if (!d) return;
    if ((editing.dimensions || []).some((x) => x.toLowerCase() === d.toLowerCase())) {
      setDimensionDraft("");
      return;
    }
    setEditing({
      ...editing,
      dimensions: [...(editing.dimensions || []), d],
    });
    setDimensionDraft("");
  };

  const removeDimension = (d: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      dimensions: (editing.dimensions || []).filter((x) => x !== d),
    });
  };

  const saveMetric = async () => {
    if (!editing) return;
    try {
      setManageLoading(true);
      setManageError(null);

      const payload: GlossaryMetric = {
        ...editing,
        canonical_name: editing.canonical_name || editing.name,
        id: editing.id || generateMetricId(editing.name),
      };

      if (!payload.id) throw new Error("Metric ID is required");
      if (!payload.name) throw new Error("Metric name is required");
      if (!payload.description) throw new Error("Metric description is required");
      if (!payload.calculation_logic) throw new Error("Calculation logic is required");

      const exists = manageMetrics.some((m) => m.id === payload.id);
      if (exists) {
        await apiClient.updateGlossaryMetric(payload.id, payload);
      } else {
        await apiClient.createGlossaryMetric(payload);
      }

      setEditing(null);
      await loadManageMetrics();
    } catch (e) {
      setManageError(e instanceof Error ? e.message : "Failed to save metric");
    } finally {
      setManageLoading(false);
    }
  };

  const deactivateMetric = async (metricId: string) => {
    try {
      setManageLoading(true);
      setManageError(null);
      await apiClient.deleteGlossaryMetric(metricId);
      await loadManageMetrics();
    } catch (e) {
      setManageError(e instanceof Error ? e.message : "Failed to deactivate metric");
    } finally {
      setManageLoading(false);
    }
  };

  const filteredMetrics = metricDefinitions.filter((metric) => {
    const matchesSearch =
      searchQuery === "" ||
      metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metric.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metric.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || metric.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
          <BookOpen className="h-4.5 w-4.5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Glossary</h1>
          <p className="text-sm text-muted-foreground">
            Metric definitions, calculations, and data governance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="peer-groups">Peer Groups</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Search and filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search metrics by name, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                  />
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.icon}
                      <span className="ml-1">{cat.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics list */}
          <div className="space-y-3">
            {filteredMetrics.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No metrics found matching your search criteria.
                </CardContent>
              </Card>
            ) : (
              filteredMetrics.map((metric) => (
                <Card key={metric.id}>
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleExpand(metric.id)}
                      className="w-full p-4 flex items-start justify-between text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{metric.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {metric.category}
                          </Badge>
                          {metric.isInternal && (
                            <Badge variant="internal" className="text-xs">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {metric.description}
                        </p>
                      </div>
                      {expandedMetric === metric.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {expandedMetric === metric.id && (
                      <div className="px-4 pb-4 pt-0 border-t">
                        <div className="grid gap-4 md:grid-cols-2 mt-4">
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Calculation Method
                            </h4>
                            <p className="text-sm">{metric.calculationMethod}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Data Source
                            </h4>
                            <Badge variant="outline">{metric.dataSource}</Badge>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Unit
                            </h4>
                            <Badge variant="secondary">{metric.unit}</Badge>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Confidence Level
                            </h4>
                            <Badge variant={metric.confidence as "high" | "medium" | "low"}>
                              {metric.confidence}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Version
                            </h4>
                            <span className="text-sm font-data">v{metric.version}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Effective Date
                            </h4>
                            <span className="text-sm font-data">{metric.effectiveDate}</span>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              Dimensions
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Dimensions are managed in the Manage tab. Each metric can have dimensions like FiscalYear, DocumentType, etc.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Manage glossary metrics</h2>
              <p className="text-sm text-muted-foreground">
                Create/edit metrics that the extractor + AI will use. Changes are saved to the backend glossary.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadManageMetrics} disabled={manageLoading}>
                Refresh
              </Button>
              <Button onClick={startCreate} disabled={manageLoading}>
                Add Metric
              </Button>
            </div>
          </div>

          {manageError && (
            <Card className="border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">{manageError}</CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Search</label>
                  <Input
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                    placeholder="Search by name, id, description, variations..."
                  />
                </div>
                <div className="w-full md:w-72">
                  <label className="text-xs font-medium text-muted-foreground">Domain</label>
                  <Select
                    value={manageDomain}
                    onValueChange={(v) => setManageDomain(v as MetricDomain | "")}
                    placeholder="All domains"
                    options={[{ value: "", label: "All domains" }, ...domainOptions]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Metrics</span>
                  <Badge variant="outline">{filteredManageMetrics.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Click a metric to edit. Inactive metrics are hidden from extraction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {manageLoading && manageMetrics.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : filteredManageMetrics.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No metrics found.</div>
                ) : (
                  filteredManageMetrics.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => startEdit(m)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        editing?.id === m.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{m.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.id}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {m.domain}
                            </Badge>
                            {!m.is_active && (
                              <Badge variant="destructive" className="text-xs">
                                inactive
                              </Badge>
                            )}
                          </div>
                          {(m.dimensions || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(m.dimensions || []).slice(0, 3).map((d) => (
                                <Badge key={d} variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900">
                                  {d}
                                </Badge>
                              ))}
                              {(m.dimensions || []).length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(m.dimensions || []).length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {m.unit}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Editor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {editing ? (editing.id ? "Edit metric" : "New metric") : "Select a metric"}
                </CardTitle>
                <CardDescription>
                  Tip: Add multiple semantic variations (synonyms) so documents with different wording still match.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editing ? (
                  <div className="text-sm text-muted-foreground">
                    Choose a metric on the left, or click “Add Metric”.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                        <Input
                          value={editing.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setEditing((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    name,
                                    canonical_name: prev.canonical_name || name,
                                    id: prev.id || generateMetricId(name),
                                  }
                                : prev
                            );
                          }}
                          placeholder="e.g., Total Operating Revenue"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Domain</label>
                        <Select
                          value={editing.domain}
                          onValueChange={(v) =>
                            setEditing((prev) => (prev ? { ...prev, domain: v as MetricDomain } : prev))
                          }
                          options={domainOptions}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Metric ID</label>
                        <Input
                          value={editing.id}
                          onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                          placeholder="metric-total-operating-revenue"
                        />
                        <div className="text-xs text-muted-foreground">
                          Must be unique. Used by rules + AI prompt context.
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Canonical name</label>
                        <Input
                          value={editing.canonical_name}
                          onChange={(e) => setEditing({ ...editing, canonical_name: e.target.value })}
                          placeholder="Total Operating Revenue"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Unit</label>
                        <Input
                          value={editing.unit}
                          onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                          placeholder="currency / count / percentage"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Update frequency</label>
                        <Input
                          value={editing.update_frequency}
                          onChange={(e) => setEditing({ ...editing, update_frequency: e.target.value })}
                          placeholder="annual / quarterly / monthly"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Data owner</label>
                        <Input
                          value={editing.data_owner}
                          onChange={(e) => setEditing({ ...editing, data_owner: e.target.value })}
                          placeholder="Finance Department"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Source</label>
                        <Input
                          value={editing.source}
                          onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                          placeholder="internal-document / ipeds / manual-entry"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Effective date</label>
                        <Input
                          type="date"
                          value={editing.effective_date}
                          onChange={(e) => setEditing({ ...editing, effective_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Active</label>
                        <Select
                          value={editing.is_active ? "true" : "false"}
                          onValueChange={(v) => setEditing({ ...editing, is_active: v === "true" })}
                          options={[
                            { value: "true", label: "Active" },
                            { value: "false", label: "Inactive" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Textarea
                        value={editing.description}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        placeholder="What does this metric measure?"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Calculation logic</label>
                      <Textarea
                        value={editing.calculation_logic}
                        onChange={(e) => setEditing({ ...editing, calculation_logic: e.target.value })}
                        placeholder="How is it calculated? (formula / sum of lines / etc.)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Semantic variations</label>
                      <div className="flex gap-2">
                        <Input
                          value={variationDraft}
                          onChange={(e) => setVariationDraft(e.target.value)}
                          placeholder="Add a synonym and press Add"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addVariation();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addVariation}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editing.semantic_variations || []).length === 0 ? (
                          <span className="text-sm text-muted-foreground">No variations yet.</span>
                        ) : (
                          (editing.semantic_variations || []).map((v) => (
                            <span
                              key={v}
                              className="inline-flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-xs"
                            >
                              {v}
                              <button
                                type="button"
                                className="hover:text-destructive"
                                onClick={() => removeVariation(v)}
                                aria-label={`Remove variation ${v}`}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Dimensions</label>
                      <div className="flex gap-2">
                        <Input
                          value={dimensionDraft}
                          onChange={(e) => setDimensionDraft(e.target.value)}
                          placeholder="Add a dimension (e.g., FiscalYear, DocumentType)"
                          list="dimensions-list"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addDimension();
                            }
                          }}
                        />
                        <datalist id="dimensions-list">
                          {availableDimensions.map((d) => (
                            <option key={d.id} value={d.name} />
                          ))}
                        </datalist>
                        <Button type="button" variant="outline" onClick={addDimension}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editing.dimensions || []).length === 0 ? (
                          <span className="text-sm text-muted-foreground">No dimensions yet.</span>
                        ) : (
                          (editing.dimensions || []).map((dimName) => {
                            const dimDef = availableDimensions.find(
                              (d) => d.name === dimName || d.id === dimName.toLowerCase().replace(/\s+/g, '_')
                            );
                            return (
                              <div
                                key={dimName}
                                className="inline-flex flex-col gap-1 rounded-md bg-blue-100 dark:bg-blue-900 px-2 py-1.5 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{dimName}</span>
                                  <button
                                    type="button"
                                    className="hover:text-destructive"
                                    onClick={() => removeDimension(dimName)}
                                    aria-label={`Remove dimension ${dimName}`}
                                  >
                                    ×
                                  </button>
                                </div>
                                {dimDef?.values && dimDef.values.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    Allowed: {dimDef.values.join(", ")}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      {(editing.dimensions || []).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <Info className="h-3 w-3 inline mr-1" />
                          Authorized values for dimensions are enforced during extraction to prevent hallucination.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button onClick={saveMetric} disabled={manageLoading} className="flex-1">
                        Save
                      </Button>
                      {editing.id && (
                        <Button
                          variant="outline"
                          onClick={() => deactivateMetric(editing.id)}
                          disabled={manageLoading}
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setEditing(null)}
                        disabled={manageLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Manage Dimensions</h2>
              <p className="text-sm text-muted-foreground">
                Define dimensions and their authorized values to prevent extraction hallucination.
              </p>
            </div>
            <Button variant="outline" onClick={loadDimensions} disabled={manageLoading}>
              Refresh
            </Button>
          </div>

          {manageError && (
            <Card className="border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">{manageError}</CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Dimensions</span>
                  <Badge variant="outline">{availableDimensions.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Click a dimension to edit its authorized values.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {manageLoading && availableDimensions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : availableDimensions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No dimensions found.</div>
                ) : (
                  availableDimensions.map((dim) => (
                    <button
                      key={dim.id}
                      onClick={() => {
                        setEditingDimension({
                          id: dim.id,
                          name: dim.name,
                          description: dim.description || "",
                          type: dim.type || "categorical",
                          values: dim.values || null,
                        });
                        setDimensionValueDraft("");
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        editingDimension?.id === dim.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{dim.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{dim.id}</div>
                          {dim.values && dim.values.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {dim.values.slice(0, 3).map((v) => (
                                <Badge key={v} variant="secondary" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                              {dim.values.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{dim.values.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-muted-foreground">No authorized values (free text)</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Editor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {editingDimension ? `Edit: ${editingDimension.name}` : "Select a dimension"}
                </CardTitle>
                <CardDescription>
                  Define authorized values to constrain extraction. Leave empty for free text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editingDimension ? (
                  <div className="text-sm text-muted-foreground">
                    Choose a dimension on the left to edit its authorized values.
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Dimension Name</label>
                      <Input value={editingDimension.name} disabled />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Dimension ID</label>
                      <Input value={editingDimension.id} disabled />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Authorized Values</label>
                      <div className="flex gap-2">
                        <Input
                          value={dimensionValueDraft}
                          onChange={(e) => setDimensionValueDraft(e.target.value)}
                          placeholder="Add an authorized value"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (dimensionValueDraft.trim()) {
                                const newValues = [...(editingDimension.values || []), dimensionValueDraft.trim()];
                                setEditingDimension({ ...editingDimension, values: newValues });
                                setDimensionValueDraft("");
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (dimensionValueDraft.trim()) {
                              const newValues = [...(editingDimension.values || []), dimensionValueDraft.trim()];
                              setEditingDimension({ ...editingDimension, values: newValues });
                              setDimensionValueDraft("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editingDimension.values || []).length === 0 ? (
                          <span className="text-sm text-muted-foreground">No authorized values. This dimension accepts free text.</span>
                        ) : (
                          (editingDimension.values || []).map((v) => (
                            <span
                              key={v}
                              className="inline-flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-xs"
                            >
                              {v}
                              <button
                                type="button"
                                className="hover:text-destructive"
                                onClick={() => {
                                  const newValues = (editingDimension.values || []).filter((x) => x !== v);
                                  setEditingDimension({ ...editingDimension, values: newValues.length > 0 ? newValues : null });
                                }}
                                aria-label={`Remove value ${v}`}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Info className="h-3 w-3 inline mr-1" />
                        If no values are specified, the dimension accepts any text. Otherwise, extraction will only use these values.
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={async () => {
                          if (!editingDimension) return;
                          try {
                            setManageLoading(true);
                            setManageError(null);
                            const dimToSave = {
                              ...editingDimension,
                              values: editingDimension.values && editingDimension.values.length > 0 ? editingDimension.values : null,
                            };
                            await apiClient.updateGlossaryDimension(editingDimension.id, dimToSave);
                            await loadDimensions();
                            setEditingDimension(null);
                            setDimensionValueDraft("");
                          } catch (e) {
                            setManageError(e instanceof Error ? e.message : "Failed to save dimension");
                          } finally {
                            setManageLoading(false);
                          }
                        }}
                        disabled={manageLoading}
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingDimension(null);
                          setDimensionValueDraft("");
                        }}
                        disabled={manageLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="peer-groups" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {peerGroups.map((group) => (
              <Card key={group.id} className="hover-lift">
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Inclusion Criteria
                      </h4>
                      <ul className="text-sm space-y-1.5">
                        {group.criteria.map((criterion, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">·</span>
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Badge variant="secondary">
                        <span className="font-data">{group.institutionCount}</span> institutions
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data-sources" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "ipeds",
                name: "IPEDS",
                fullName: "Integrated Postsecondary Education Data System",
                description: "Federal data collection system administered by NCES",
                type: "external",
                frequency: "Annual",
                reliability: "high",
              },
              {
                id: "common-data-set",
                name: "Common Data Set",
                fullName: "Common Data Set Initiative",
                description: "Standardized data collection for college guidebooks and rankings",
                type: "external",
                frequency: "Annual",
                reliability: "high",
              },
              {
                id: "internal-document",
                name: "Internal Documents",
                fullName: "Proprietary Internal Data",
                description: "Data extracted from internal financial statements, reports, and presentations",
                type: "internal",
                frequency: "Varies",
                reliability: "high",
              },
              {
                id: "manual-entry",
                name: "Manual Entry",
                fullName: "Manually Entered Data",
                description: "Data entered manually by analysts or administrators",
                type: "internal",
                frequency: "As needed",
                reliability: "medium",
              },
              {
                id: "calculated",
                name: "Calculated",
                fullName: "Derived Metrics",
                description: "Metrics calculated from other data points using defined formulas",
                type: "derived",
                frequency: "Real-time",
                reliability: "medium",
              },
              {
                id: "usnews",
                name: "US News",
                fullName: "US News & World Report",
                description: "Rankings and data from US News college rankings",
                type: "external",
                frequency: "Annual",
                reliability: "medium",
              },
            ].map((source) => (
              <Card key={source.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    {source.name}
                    <Badge
                      variant={source.type === "internal" ? "internal" : source.type === "external" ? "external" : "secondary"}
                      className="text-xs"
                    >
                      {source.type}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {source.fullName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {source.description}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">
                      {source.frequency}
                    </Badge>
                    <Badge variant={source.reliability as "high" | "medium" | "low"}>
                      {source.reliability} reliability
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
