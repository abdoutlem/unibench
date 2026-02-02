"use client";

import { useState } from "react";
import Link from "next/link";
import { GlobalFilters } from "@/components/filters";
import { TrendChart } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
  metricDefinitions,
  getMetricTimeSeries,
  getLatestMetricValue,
  getInternalMetrics,
} from "@/data";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { Building2, FileText, ChevronRight } from "lucide-react";

export default function PortfolioPage() {
  const [selectedMetric, setSelectedMetric] = useState("metric-total-revenue");
  const portfolioInstitutions = getPortfolioInstitutions();
  const internalMetrics = getInternalMetrics();

  const metricOptions = metricDefinitions.map((m) => ({
    value: m.id,
    label: m.shortName,
  }));

  const selectedMetricDef = metricDefinitions.find((m) => m.id === selectedMetric);

  // Get time series for all portfolio institutions for selected metric
  const trendSeries = portfolioInstitutions
    .map((inst) => getMetricTimeSeries(inst.id, selectedMetric))
    .filter(Boolean) as NonNullable<ReturnType<typeof getMetricTimeSeries>>[];

  const formatValue = (value: number, unit: string) => {
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-muted-foreground">
              Internal institutional data and analysis
            </p>
          </div>
        </div>
        <Badge variant="internal" className="text-sm px-3 py-1">
          Internal Data
        </Badge>
      </div>

      {/* Global filters */}
      <GlobalFilters />

      {/* Internal metrics highlight */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Internal-Only Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            These metrics are derived from internal documents and are not available
            for external benchmarking.
          </p>
          <div className="flex flex-wrap gap-2">
            {internalMetrics.map((metric) => (
              <Badge key={metric.id} variant="outline" className="bg-white">
                {metric.shortName}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric selector and trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Metric Trend</CardTitle>
            <Select
              value={selectedMetric}
              onValueChange={setSelectedMetric}
              options={metricOptions}
              className="w-48"
            />
          </CardHeader>
          <CardContent>
            {selectedMetricDef && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <div className="font-medium">{selectedMetricDef.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedMetricDef.description}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span>
                    Source:{" "}
                    <Badge variant="outline" className="text-xs">
                      {selectedMetricDef.dataSource}
                    </Badge>
                  </span>
                  <span>
                    Confidence:{" "}
                    <Badge
                      variant={selectedMetricDef.confidence as "high" | "medium" | "low"}
                      className="text-xs"
                    >
                      {selectedMetricDef.confidence}
                    </Badge>
                  </span>
                </div>
              </div>
            )}
            <TrendChart
              title=""
              series={trendSeries}
              unit={selectedMetricDef?.unit || "count"}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Institution list */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Institutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {portfolioInstitutions.map((inst) => {
              const latestValue = getLatestMetricValue(inst.id, selectedMetric);
              return (
                <Link
                  key={inst.id}
                  href={`/portfolio/${inst.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <div className="font-medium">{inst.shortName}</div>
                    <div className="text-sm text-muted-foreground">
                      {inst.state} · {inst.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestValue && (
                      <span className="text-sm font-medium">
                        {formatValue(latestValue.value, selectedMetricDef?.unit || "count")}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Research $</TableHead>
                <TableHead className="text-right">Enrollment</TableHead>
                <TableHead className="text-right">Retention</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioInstitutions.map((inst) => {
                const revenue = getLatestMetricValue(inst.id, "metric-total-revenue");
                const research = getLatestMetricValue(inst.id, "metric-research-expenditure");
                const enrollment = getLatestMetricValue(inst.id, "metric-total-enrollment");
                const retention = getLatestMetricValue(inst.id, "metric-retention-rate");

                return (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.shortName}</TableCell>
                    <TableCell>{inst.state}</TableCell>
                    <TableCell className="capitalize">{inst.type}</TableCell>
                    <TableCell className="text-right">
                      {revenue ? formatCurrency(revenue.value, true) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {research ? formatCurrency(research.value, true) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {enrollment ? formatNumber(enrollment.value, true) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {retention ? formatPercent(retention.value) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/portfolio/${inst.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
