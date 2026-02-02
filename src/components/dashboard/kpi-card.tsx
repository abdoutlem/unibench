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
      ? "text-green-600"
      : "text-red-600"
    : kpi.trend === "up"
    ? "text-red-600"
    : "text-green-600";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-2 text-3xl font-bold">{formatValue(kpi.value)}</p>
          </div>
          <Badge variant={kpi.source === "internal" ? "internal" : "external"}>
            {kpi.source}
          </Badge>
        </div>
        <div className={cn("mt-4 flex items-center gap-2 text-sm", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="font-medium">{changeFormatted}</span>
          <span className="text-muted-foreground">vs prior year</span>
        </div>
      </CardContent>
    </Card>
  );
}
