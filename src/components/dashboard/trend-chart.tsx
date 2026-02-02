"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InstitutionMetricSeries } from "@/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface TrendChartProps {
  title: string;
  series: InstitutionMetricSeries[];
  unit: "currency" | "percentage" | "count" | "ratio" | "rank";
  height?: number;
}

const COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
];

export function TrendChart({
  title,
  series,
  unit,
  height = 300,
}: TrendChartProps) {
  // Transform data for recharts
  const data = series[0]?.data.map((point) => {
    const entry: Record<string, number> = { year: point.fiscalYear };
    series.forEach((s) => {
      const dataPoint = s.data.find((d) => d.fiscalYear === point.fiscalYear);
      if (dataPoint) {
        entry[s.institutionName] = dataPoint.value;
      }
    });
    return entry;
  }) || [];

  const formatValue = (value: number) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              width={80}
            />
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              labelFormatter={(label) => `FY ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            {series.map((s, index) => (
              <Line
                key={s.institutionId}
                type="monotone"
                dataKey={s.institutionName}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
