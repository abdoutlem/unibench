"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DashboardKPI } from "@/types";
import { formatCurrency, formatNumber, formatPercent, cn } from "@/lib/utils";

interface KPICardProps {
  kpi: DashboardKPI;
}

export function KPICard({ kpi }: KPICardProps) {
  const formatValue = (value: number) => {
    switch (kpi.unit) {
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

  const change = ((kpi.value - kpi.previousValue) / kpi.previousValue) * 100;
  const changeFormatted = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

  const TrendIcon =
    kpi.trend === "up"
      ? TrendingUp
      : kpi.trend === "down"
      ? TrendingDown
      : Minus;

  const trendColor = kpi.trendIsPositive
    ? kpi.trend === "up"
      ? "text-emerald-600"
      : "text-rose-600"
    : kpi.trend === "up"
    ? "text-rose-600"
    : "text-emerald-600";

  return (
    <Card className="hover-lift">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {kpi.label}
          </p>
          <Badge variant={kpi.source === "internal" ? "internal" : "external"}>
            {kpi.source}
          </Badge>
        </div>
        <p className="text-2xl font-display font-semibold tracking-tight font-data">
          {formatValue(kpi.value)}
        </p>
        <div className={cn("mt-3 flex items-center gap-1.5 text-xs", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="font-semibold font-data">{changeFormatted}</span>
          <span className="text-muted-foreground ml-0.5">vs prior year</span>
        </div>
      </CardContent>
    </Card>
  );
}
