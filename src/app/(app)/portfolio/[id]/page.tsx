"use client";

import { use } from "react";
import Link from "next/link";
import { TrendChart } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  getInstitutionById,
  metricDefinitions,
  getMetricTimeSeries,
  getLatestMetricValue,
  peerGroups,
} from "@/data";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
} from "lucide-react";

export default function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const institution = getInstitutionById(id);

  if (!institution) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h1 className="text-2xl font-bold">Institution not found</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/portfolio">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portfolio
          </Link>
        </Button>
      </div>
    );
  }

  const institutionPeerGroups = peerGroups.filter((pg) =>
    institution.peerGroupIds.includes(pg.id)
  );

  // Key metrics for display
  const keyMetrics = [
    "metric-total-revenue",
    "metric-research-expenditure",
    "metric-endowment",
    "metric-total-enrollment",
    "metric-retention-rate",
    "metric-6yr-grad-rate",
  ];

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

  // Get enrollment trend
  const enrollmentSeries = getMetricTimeSeries(id, "metric-total-enrollment");
  const revenueSeries = getMetricTimeSeries(id, "metric-total-revenue");

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/portfolio">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Portfolio
        </Link>
      </Button>

      {/* Institution header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-internal/10 text-xl font-display font-semibold text-internal">
            {institution.shortName.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{institution.name}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {institution.state}, {institution.region}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span className="capitalize">{institution.type}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Updated {institution.updatedAt}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="internal" className="text-sm px-3 py-1">
          Portfolio Institution
        </Badge>
      </div>

      {/* Peer groups */}
      <Card className="border-l-2 border-l-internal">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-internal" />
            Peer Group Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {institutionPeerGroups.map((pg) => (
              <Badge key={pg.id} variant="secondary" className="text-sm">
                {pg.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key metrics grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keyMetrics.map((metricId) => {
          const metric = metricDefinitions.find((m) => m.id === metricId);
          const value = getLatestMetricValue(id, metricId);
          if (!metric) return null;

          return (
            <Card key={metricId} className="hover-lift">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {metric.shortName}
                  </div>
                  <Badge
                    variant={metric.isInternal ? "internal" : "outline"}
                    className="text-xs"
                  >
                    {metric.isInternal ? "int" : "pub"}
                  </Badge>
                </div>
                <div className="mt-2 text-2xl font-display font-semibold font-data">
                  {value ? formatValue(value.value, metric.unit) : "—"}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-data">FY {value?.fiscalYear || "—"}</span>
                  <span className="text-border">·</span>
                  <Badge
                    variant={value?.confidence as "high" | "medium" | "low" || "outline"}
                    className="text-xs"
                  >
                    {value?.confidence || "N/A"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {enrollmentSeries && (
          <TrendChart
            title="Enrollment Trend"
            series={[enrollmentSeries]}
            unit="count"
            height={280}
          />
        )}
        {revenueSeries && (
          <TrendChart
            title="Total Revenue Trend"
            series={[revenueSeries]}
            unit="currency"
            height={280}
          />
        )}
      </div>

      {/* Full metrics table */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricDefinitions
                .filter((m) => !m.isInternal || institution.isPortfolio)
                .map((metric) => {
                  const value = getLatestMetricValue(id, metric.id);
                  return (
                    <TableRow key={metric.id}>
                      <TableCell>
                        <div className="font-medium">{metric.shortName}</div>
                        <div className="text-xs text-muted-foreground">
                          {metric.name}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{metric.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {metric.dataSource}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium font-data">
                        {value ? formatValue(value.value, metric.unit) : "—"}
                      </TableCell>
                      <TableCell className="font-data">FY {value?.fiscalYear || "—"}</TableCell>
                      <TableCell>
                        {value && (
                          <Badge
                            variant={value.confidence as "high" | "medium" | "low"}
                            className="text-xs"
                          >
                            {value.confidence}
                          </Badge>
                        )}
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
