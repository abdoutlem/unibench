"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface ComparisonBarChartProps {
  title: string;
  data: {
    name: string;
    portfolio: number;
    benchmark: number;
    isPortfolio: boolean;
  }[];
  unit: "currency" | "percentage" | "count" | "ratio" | "rank";
  height?: number;
}

export function ComparisonBarChart({
  title,
  data,
  unit,
  height = 300,
}: ComparisonBarChartProps) {
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
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 16, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={75}
            />
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="portfolio" name="Portfolio" fill="hsl(210, 60%, 42%)" radius={[0, 3, 3, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`portfolio-${index}`}
                  fill={entry.isPortfolio ? "hsl(210, 60%, 42%)" : "hsl(var(--muted-foreground) / 0.3)"}
                />
              ))}
            </Bar>
            <Bar dataKey="benchmark" name="Benchmark Avg" fill="hsl(152, 40%, 38%)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
