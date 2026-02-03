"use client";

import { GlobalFilters } from "@/components/filters";
import { KPICard, TrendChart, ComparisonBarChart } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  dashboardKPIs,
  getPortfolioInstitutions,
  getMetricTimeSeries,
  getLatestMetricValue,
  metricDefinitions,
} from "@/data";
import { useState } from "react";
import { ArrowRight, Building2, BarChart3, GitCompare } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const portfolioInstitutions = getPortfolioInstitutions();

  const researchSeries = portfolioInstitutions.slice(0, 4).map((inst) =>
    getMetricTimeSeries(inst.id, "metric-research-expenditure")
  ).filter(Boolean) as NonNullable<ReturnType<typeof getMetricTimeSeries>>[];

  const retentionData = portfolioInstitutions.map((inst) => {
    const value = getLatestMetricValue(inst.id, "metric-retention-rate");
    return {
      name: inst.shortName,
      portfolio: value?.value || 0,
      benchmark: 90.5,
      isPortfolio: true,
    };
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Portfolio overview and key performance indicators
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/portfolio">
            View Portfolio <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Global filters */}
      <GlobalFilters />

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardKPIs.map((kpi, i) => (
              <div key={kpi.id} className={`animate-fade-in stagger-${i + 1}`}>
                <KPICard kpi={kpi} />
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              title="Research Expenditures Trend"
              series={researchSeries}
              unit="currency"
              height={280}
            />
            <ComparisonBarChart
              title="Retention Rate by Institution"
              data={retentionData}
              unit="percentage"
              height={280}
            />
          </div>

          {/* Quick access cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/portfolio" className="group">
              <Card className="hover-lift h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-internal/10">
                    <Building2 className="h-5 w-5 text-internal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Portfolio Data</div>
                    <div className="text-xs text-muted-foreground">
                      {portfolioInstitutions.length} institutions
                    </div>
                  </div>
                  <Badge variant="internal">Internal</Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/benchmarks" className="group">
              <Card className="hover-lift h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-external/10">
                    <BarChart3 className="h-5 w-5 text-external" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Benchmarks</div>
                    <div className="text-xs text-muted-foreground">
                      Peer group analysis
                    </div>
                  </div>
                  <Badge variant="external">External</Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/compare" className="group">
              <Card className="hover-lift h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-copper/10">
                    <GitCompare className="h-5 w-5 text-copper" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Compare</div>
                    <div className="text-xs text-muted-foreground">
                      Internal vs External
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardKPIs
              .filter((kpi) => kpi.label.toLowerCase().includes("revenue") || kpi.label.toLowerCase().includes("maintenance"))
              .map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} />
              ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Financial metrics coming soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Additional financial charts and analysis will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardKPIs
              .filter((kpi) => kpi.label.toLowerCase().includes("enrollment"))
              .map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} />
              ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Enrollment trends coming soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enrollment analysis and demographic breakdowns will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardKPIs
              .filter((kpi) =>
                kpi.label.toLowerCase().includes("retention") ||
                kpi.label.toLowerCase().includes("grad")
              )
              .map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} />
              ))}
          </div>
          <ComparisonBarChart
            title="Retention Rate by Institution"
            data={retentionData}
            unit="percentage"
            height={320}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
