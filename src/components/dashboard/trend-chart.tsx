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
  "hsl(210, 60%, 42%)",
  "hsl(152, 40%, 38%)",
  "hsl(20, 60%, 55%)",
  "hsl(270, 40%, 50%)",
  "hsl(35, 55%, 50%)",
  "hsl(190, 50%, 40%)",
];

export function TrendChart({
  title,
  series,
  unit,
  height = 300,
}: TrendChartProps) {
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

  if (!title) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => formatValue(Number(value))}
            labelFormatter={(label) => `FY ${label}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {series.map((s, index) => (
            <Line
              key={s.institutionId}
              type="monotone"
              dataKey={s.institutionName}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              labelFormatter={(label) => `FY ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {series.map((s, index) => (
              <Line
                key={s.institutionId}
                type="monotone"
                dataKey={s.institutionName}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
