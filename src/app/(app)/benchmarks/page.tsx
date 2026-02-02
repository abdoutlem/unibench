"use client";

import { useState } from "react";
import { GlobalFilters } from "@/components/filters";
import { TrendChart, ComparisonBarChart } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  institutions,
  peerGroups,
  metricDefinitions,
  getBenchmarkableMetrics,
  getMetricTimeSeries,
  getLatestMetricValue,
  getInstitutionsByPeerGroup,
} from "@/data";
import { useFiltersStore } from "@/store";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { BarChart3, Database, CheckCircle, AlertCircle, Info } from "lucide-react";

export default function BenchmarksPage() {
  const { selectedPeerGroupId, setSelectedPeerGroup } = useFiltersStore();
  const [selectedMetric, setSelectedMetric] = useState("metric-retention-rate");
  const [activeTab, setActiveTab] = useState("overview");

  const benchmarkableMetrics = getBenchmarkableMetrics();
  const selectedPeerGroup = peerGroups.find((pg) => pg.id === selectedPeerGroupId);
  const peerInstitutions = selectedPeerGroupId
    ? getInstitutionsByPeerGroup(selectedPeerGroupId)
    : institutions;

  const peerGroupOptions = peerGroups.map((pg) => ({
    value: pg.id,
    label: pg.name,
  }));

  const metricOptions = benchmarkableMetrics.map((m) => ({
    value: m.id,
    label: m.shortName,
  }));

  const selectedMetricDef = metricDefinitions.find((m) => m.id === selectedMetric);

  // Calculate peer group averages
  const calculatePeerAverage = (metricId: string) => {
    const values = peerInstitutions
      .map((inst) => getLatestMetricValue(inst.id, metricId)?.value)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const formatValue = (value: number | null, unit: string) => {
    if (value === null) return "—";
    switch (unit) {
      case "currency":
        return formatCurrency(value, true);
      case "percentage":
        return formatPercent(value);
      case "count":
        return formatNumber(value, true);
      default:
        return value.toLocaleString();
    }
  };

  // Get comparison data for bar chart
  const comparisonData = peerInstitutions.slice(0, 8).map((inst) => {
    const value = getLatestMetricValue(inst.id, selectedMetric);
    const avg = calculatePeerAverage(selectedMetric);
    return {
      name: inst.shortName,
      portfolio: value?.value || 0,
      benchmark: avg || 0,
      isPortfolio: inst.isPortfolio,
    };
  });

  // Get time series for selected metric
  const trendSeries = peerInstitutions
    .slice(0, 4)
    .map((inst) => getMetricTimeSeries(inst.id, selectedMetric))
    .filter(Boolean) as NonNullable<ReturnType<typeof getMetricTimeSeries>>[];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <BarChart3 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Benchmarks</h1>
            <p className="text-muted-foreground">
              External peer group analysis and comparisons
            </p>
          </div>
        </div>
        <Badge variant="external" className="text-sm px-3 py-1">
          External Data
        </Badge>
      </div>

      {/* Global filters */}
      <GlobalFilters />

      {/* Peer group info */}
      {selectedPeerGroup && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              {selectedPeerGroup.name}
            </CardTitle>
            <CardDescription>{selectedPeerGroup.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {peerInstitutions.length} institutions
              </span>
              <span className="flex items-center gap-1">
                <Info className="h-4 w-4 text-blue-600" />
                Criteria: {selectedPeerGroup.criteria.join(", ")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metric Analysis</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { metric: "metric-retention-rate", label: "Avg. Retention" },
              { metric: "metric-6yr-grad-rate", label: "Avg. 6-Yr Grad Rate" },
              { metric: "metric-research-expenditure", label: "Avg. Research $" },
              { metric: "metric-total-enrollment", label: "Avg. Enrollment" },
            ].map(({ metric, label }) => {
              const avg = calculatePeerAverage(metric);
              const metricDef = metricDefinitions.find((m) => m.id === metric);
              return (
                <Card key={metric}>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                      {formatValue(avg, metricDef?.unit || "count")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Peer group average
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              title="Retention Rate Trends"
              series={trendSeries}
              unit={selectedMetricDef?.unit || "percentage"}
              height={300}
            />
            <ComparisonBarChart
              title="Retention by Institution"
              data={comparisonData}
              unit={selectedMetricDef?.unit || "percentage"}
              height={300}
            />
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Metric selector */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Metric Analysis</CardTitle>
              <Select
                value={selectedMetric}
                onValueChange={setSelectedMetric}
                options={metricOptions}
                className="w-48"
              />
            </CardHeader>
            <CardContent>
              {selectedMetricDef && (
                <div className="p-4 rounded-lg bg-muted/50 mb-6">
                  <div className="font-medium">{selectedMetricDef.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedMetricDef.description}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span>
                      Source:{" "}
                      <Badge variant="outline">{selectedMetricDef.dataSource}</Badge>
                    </span>
                    <span>
                      Unit:{" "}
                      <Badge variant="outline">{selectedMetricDef.unit}</Badge>
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <TrendChart
                  title={`${selectedMetricDef?.shortName || "Metric"} Trend`}
                  series={trendSeries}
                  unit={selectedMetricDef?.unit || "count"}
                  height={280}
                />
                <ComparisonBarChart
                  title="Institution Comparison"
                  data={comparisonData}
                  unit={selectedMetricDef?.unit || "count"}
                  height={280}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institutions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Peer Institutions</CardTitle>
              <CardDescription>
                All institutions in the selected peer group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Retention</TableHead>
                    <TableHead className="text-right">6-Yr Grad</TableHead>
                    <TableHead className="text-right">Research $</TableHead>
                    <TableHead className="text-right">Enrollment</TableHead>
                    <TableHead>Portfolio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peerInstitutions.map((inst) => {
                    const retention = getLatestMetricValue(inst.id, "metric-retention-rate");
                    const gradRate = getLatestMetricValue(inst.id, "metric-6yr-grad-rate");
                    const research = getLatestMetricValue(inst.id, "metric-research-expenditure");
                    const enrollment = getLatestMetricValue(inst.id, "metric-total-enrollment");

                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{inst.shortName}</TableCell>
                        <TableCell>{inst.state}</TableCell>
                        <TableCell className="capitalize">{inst.type}</TableCell>
                        <TableCell className="text-right">
                          {retention ? formatPercent(retention.value) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {gradRate ? formatPercent(gradRate.value) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {research ? formatCurrency(research.value, true) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {enrollment ? formatNumber(enrollment.value, true) : "—"}
                        </TableCell>
                        <TableCell>
                          {inst.isPortfolio ? (
                            <Badge variant="internal" className="text-xs">
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
