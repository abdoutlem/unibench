"use client";

import { useState } from "react";
import { GlobalFilters } from "@/components/filters";
import { TrendChart, ComparisonBarChart } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  getPortfolioInstitutions,
  getBenchmarkInstitutions,
  peerGroups,
  metricDefinitions,
  getBenchmarkableMetrics,
  getMetricTimeSeries,
  getLatestMetricValue,
  getInstitutionsByPeerGroup,
} from "@/data";
import { useFiltersStore } from "@/store";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function ComparePage() {
  const { selectedPeerGroupId } = useFiltersStore();
  const [selectedMetric, setSelectedMetric] = useState("metric-retention-rate");
  const [selectedInstitution, setSelectedInstitution] = useState("inst-001");

  const portfolioInstitutions = getPortfolioInstitutions();
  const benchmarkableMetrics = getBenchmarkableMetrics();
  const peerInstitutions = selectedPeerGroupId
    ? getInstitutionsByPeerGroup(selectedPeerGroupId)
    : [];

  const institutionOptions = portfolioInstitutions.map((inst) => ({
    value: inst.id,
    label: inst.shortName,
  }));

  const metricOptions = benchmarkableMetrics.map((m) => ({
    value: m.id,
    label: m.shortName,
  }));

  const selectedInst = portfolioInstitutions.find((i) => i.id === selectedInstitution);
  const selectedMetricDef = metricDefinitions.find((m) => m.id === selectedMetric);

  // Calculate peer group average
  const calculatePeerAverage = (metricId: string) => {
    const values = peerInstitutions
      .map((inst) => getLatestMetricValue(inst.id, metricId)?.value)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Calculate portfolio average
  const calculatePortfolioAverage = (metricId: string) => {
    const values = portfolioInstitutions
      .map((inst) => getLatestMetricValue(inst.id, metricId)?.value)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Calculate percentile
  const calculatePercentile = (value: number, metricId: string) => {
    const allValues = peerInstitutions
      .map((inst) => getLatestMetricValue(inst.id, metricId)?.value)
      .filter((v): v is number => v !== null && v !== undefined)
      .sort((a, b) => a - b);

    if (allValues.length === 0) return null;
    const index = allValues.filter((v) => v <= value).length;
    return Math.round((index / allValues.length) * 100);
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

  // Comparison metrics for the selected institution
  const comparisonMetrics = benchmarkableMetrics.slice(0, 8).map((metric) => {
    const instValue = getLatestMetricValue(selectedInstitution, metric.id)?.value;
    const peerAvg = calculatePeerAverage(metric.id);
    const variance = instValue && peerAvg ? instValue - peerAvg : null;
    const variancePercent = instValue && peerAvg ? ((instValue - peerAvg) / peerAvg) * 100 : null;
    const percentile = instValue ? calculatePercentile(instValue, metric.id) : null;

    return {
      metric,
      instValue,
      peerAvg,
      variance,
      variancePercent,
      percentile,
    };
  });

  // Get trend data for comparison
  const instSeries = getMetricTimeSeries(selectedInstitution, selectedMetric);

  // Create pseudo-series for peer average (simplified)
  const peerAvgData = instSeries?.data.map((point) => {
    const peerValues = peerInstitutions
      .map((inst) => {
        const series = getMetricTimeSeries(inst.id, selectedMetric);
        return series?.data.find((d) => d.fiscalYear === point.fiscalYear)?.value;
      })
      .filter((v): v is number => v !== null && v !== undefined);
    const avg = peerValues.length > 0 ? peerValues.reduce((a, b) => a + b, 0) / peerValues.length : 0;
    return { fiscalYear: point.fiscalYear, value: avg, confidence: "high" as const };
  });

  const comparisonSeries = [
    ...(instSeries ? [instSeries] : []),
    ...(peerAvgData
      ? [
          {
            institutionId: "peer-avg",
            institutionName: "Peer Average",
            metricId: selectedMetric,
            data: peerAvgData,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <GitCompare className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Compare</h1>
            <p className="text-muted-foreground">
              Internal portfolio vs external benchmarks
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="internal">Internal</Badge>
          <span className="text-muted-foreground">vs</span>
          <Badge variant="external">External</Badge>
        </div>
      </div>

      {/* Global filters */}
      <GlobalFilters />

      {/* Institution selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Institution Comparison</CardTitle>
            <CardDescription>
              Compare a portfolio institution against peer benchmarks
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <Select
              value={selectedInstitution}
              onValueChange={setSelectedInstitution}
              options={institutionOptions}
              className="w-48"
            />
            <Select
              value={selectedMetric}
              onValueChange={setSelectedMetric}
              options={metricOptions}
              className="w-48"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Summary comparison cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <Badge variant="internal" className="text-xs">Internal</Badge>
              {selectedInst?.shortName}
            </div>
            <div className="mt-2 text-3xl font-bold">
              {formatValue(
                getLatestMetricValue(selectedInstitution, selectedMetric)?.value || null,
                selectedMetricDef?.unit || "count"
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {selectedMetricDef?.shortName}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <Badge variant="external" className="text-xs">External</Badge>
              Peer Average
            </div>
            <div className="mt-2 text-3xl font-bold">
              {formatValue(
                calculatePeerAverage(selectedMetric),
                selectedMetricDef?.unit || "count"
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {peerInstitutions.length} institutions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Variance</div>
            {(() => {
              const instVal = getLatestMetricValue(selectedInstitution, selectedMetric)?.value;
              const peerAvg = calculatePeerAverage(selectedMetric);
              if (!instVal || !peerAvg) return <div className="mt-2 text-3xl font-bold">—</div>;

              const variance = instVal - peerAvg;
              const variancePct = (variance / peerAvg) * 100;
              const isPositive = variance > 0;

              return (
                <>
                  <div className={cn(
                    "mt-2 text-3xl font-bold flex items-center gap-2",
                    isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {isPositive ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    {formatValue(Math.abs(variance), selectedMetricDef?.unit || "count")}
                  </div>
                  <div className={cn(
                    "mt-1 text-sm",
                    isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {isPositive ? "+" : ""}{variancePct.toFixed(1)}% vs peer average
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Trend comparison */}
      <TrendChart
        title={`${selectedMetricDef?.shortName || "Metric"}: ${selectedInst?.shortName || "Institution"} vs Peer Average`}
        series={comparisonSeries}
        unit={selectedMetricDef?.unit || "count"}
        height={350}
      />

      {/* Full metrics comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>Full Metrics Comparison</CardTitle>
          <CardDescription>
            {selectedInst?.shortName} compared against peer group benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">
                  <Badge variant="internal" className="text-xs mr-2">Internal</Badge>
                  {selectedInst?.shortName}
                </TableHead>
                <TableHead className="text-right">
                  <Badge variant="external" className="text-xs mr-2">External</Badge>
                  Peer Avg
                </TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Percentile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonMetrics.map(({ metric, instValue, peerAvg, variance, variancePercent, percentile }) => (
                <TableRow key={metric.id}>
                  <TableCell>
                    <div className="font-medium">{metric.shortName}</div>
                    <div className="text-xs text-muted-foreground">{metric.category}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatValue(instValue ?? null, metric.unit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(peerAvg, metric.unit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {variance !== null && variancePercent !== null ? (
                      <span className={cn(
                        "flex items-center justify-end gap-1",
                        variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : ""
                      )}>
                        {variance > 0 ? <TrendingUp className="h-4 w-4" /> : variance < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        {variancePercent > 0 ? "+" : ""}{variancePercent.toFixed(1)}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {percentile !== null ? (
                      <Badge
                        variant={percentile >= 75 ? "high" : percentile >= 50 ? "medium" : "low"}
                      >
                        {percentile}th
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
