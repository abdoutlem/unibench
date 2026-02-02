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
import { ArrowRight, TrendingUp, Building2, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const portfolioInstitutions = getPortfolioInstitutions();

  // Get time series for research expenditure trend
  const researchSeries = portfolioInstitutions.slice(0, 4).map((inst) =>
    getMetricTimeSeries(inst.id, "metric-research-expenditure")
  ).filter(Boolean) as NonNullable<ReturnType<typeof getMetricTimeSeries>>[];

  // Get retention rate comparison data
  const retentionData = portfolioInstitutions.map((inst) => {
    const value = getLatestMetricValue(inst.id, "metric-retention-rate");
    return {
      name: inst.shortName,
      portfolio: value?.value || 0,
      benchmark: 90.5, // Mock benchmark average
      isPortfolio: true,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Portfolio overview and key performance indicators
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/portfolio">
              View Portfolio <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
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
            {dashboardKPIs.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              title="Research Expenditures Trend"
              series={researchSeries}
              unit="currency"
              height={300}
            />
            <ComparisonBarChart
              title="Retention Rate by Institution"
              data={retentionData}
              unit="percentage"
              height={300}
            />
          </div>

          {/* Quick access cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/portfolio">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Portfolio Data</div>
                    <div className="text-sm text-muted-foreground">
                      {portfolioInstitutions.length} institutions
                    </div>
                  </div>
                  <Badge variant="internal" className="ml-auto">
                    Internal
                  </Badge>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/benchmarks">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Benchmarks</div>
                    <div className="text-sm text-muted-foreground">
                      Peer group analysis
                    </div>
                  </div>
                  <Badge variant="external" className="ml-auto">
                    External
                  </Badge>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/compare">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Compare</div>
                    <div className="text-sm text-muted-foreground">
                      Internal vs External
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
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
              <p className="text-muted-foreground">
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
              <p className="text-muted-foreground">
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
            height={350}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
