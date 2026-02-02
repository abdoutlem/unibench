import { DashboardKPI } from "@/types";

export const dashboardKPIs: DashboardKPI[] = [
  {
    id: "kpi-total-revenue",
    label: "Total Portfolio Revenue",
    value: 17400000000,
    previousValue: 16200000000,
    unit: "currency",
    trend: "up",
    trendIsPositive: true,
    source: "internal",
  },
  {
    id: "kpi-avg-retention",
    label: "Avg. Retention Rate",
    value: 94.2,
    previousValue: 93.8,
    unit: "percentage",
    trend: "up",
    trendIsPositive: true,
    source: "external",
  },
  {
    id: "kpi-research-growth",
    label: "Research $ Growth",
    value: 7.8,
    previousValue: 5.2,
    unit: "percentage",
    trend: "up",
    trendIsPositive: true,
    source: "external",
  },
  {
    id: "kpi-total-enrollment",
    label: "Total Enrollment",
    value: 234000,
    previousValue: 229500,
    unit: "count",
    trend: "up",
    trendIsPositive: true,
    source: "external",
  },
  {
    id: "kpi-grad-rate",
    label: "6-Year Grad Rate",
    value: 86.4,
    previousValue: 85.1,
    unit: "percentage",
    trend: "up",
    trendIsPositive: true,
    source: "external",
  },
  {
    id: "kpi-deferred-maint",
    label: "Deferred Maintenance",
    value: 3290000000,
    previousValue: 3050000000,
    unit: "currency",
    trend: "up",
    trendIsPositive: false,
    source: "internal",
  },
];

export const getKPIsBySource = (source: "internal" | "external") =>
  dashboardKPIs.filter((kpi) => kpi.source === source);
