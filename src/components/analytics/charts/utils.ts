import type { ExploreResponse } from "@/types/analytics";

/**
 * Transforms flat ExploreResponse rows into pivoted series data for Recharts.
 *
 * The first string column is used as the X-axis key.
 * If there's a second string column, rows are pivoted so each unique value
 * in that column becomes a separate series.
 * If there's only one string column (or none), a single "value" series is created.
 */
export function buildSeriesData(data: ExploreResponse): {
  chartData: Record<string, any>[];
  seriesKeys: string[];
  xKey: string;
} {
  const stringCols = data.columns.filter((c) => c.type === "string" && c.name !== "unit" && c.name !== "metric_id");
  const valueCol = "value";

  if (stringCols.length === 0) {
    // No grouping at all — single row table
    return {
      chartData: data.rows.map((r, i) => ({ label: `Row ${i + 1}`, value: r[valueCol] })),
      seriesKeys: [valueCol],
      xKey: "label",
    };
  }

  if (stringCols.length === 1) {
    // Single dimension — simple bar/line
    const xKey = stringCols[0].name;
    return {
      chartData: data.rows.map((r) => ({ [xKey]: r[xKey], value: Number(r[valueCol] ?? 0) })),
      seriesKeys: [valueCol],
      xKey,
    };
  }

  // Two+ string columns — pivot the second into series
  const xKey = stringCols[0].name;
  const seriesCol = stringCols[1].name;

  // Collect unique series values
  const seriesSet = new Set<string>();
  data.rows.forEach((r) => {
    if (r[seriesCol] != null) seriesSet.add(String(r[seriesCol]));
  });
  const seriesKeys = Array.from(seriesSet);

  // Group by xKey
  const grouped: Record<string, Record<string, any>> = {};
  data.rows.forEach((r) => {
    const x = String(r[xKey] ?? "");
    if (!grouped[x]) grouped[x] = { [xKey]: x };
    const sk = String(r[seriesCol] ?? "");
    grouped[x][sk] = Number(r[valueCol] ?? 0);
  });

  const chartData = Object.values(grouped);

  return { chartData, seriesKeys, xKey };
}
