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
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              tickFormatter={formatValue}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="portfolio" name="Portfolio" fill="#2563eb" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`portfolio-${index}`}
                  fill={entry.isPortfolio ? "#2563eb" : "#94a3b8"}
                />
              ))}
            </Bar>
            <Bar dataKey="benchmark" name="Benchmark Avg" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
