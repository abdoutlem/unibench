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

// --- Multidimensional decomposition ---

export interface DecomposeResultSingle {
  mode: "single";
}

export interface FacetData {
  label: string;
  data: ExploreResponse;
}

export interface DecomposeResultGrid {
  mode: "grid";
  facetColumn: string;
  facets: FacetData[];
  gridCols: number;
}

export type DecomposeResult = DecomposeResultSingle | DecomposeResultGrid;

const MAX_FACETS = 12;

/**
 * Decides whether to render a single chart or a faceted grid.
 *
 * - 0-2 string columns (excl. unit, metric_id): single chart (existing behaviour).
 * - 3+ string columns: split rows by unique values of the 3rd string column,
 *   producing one sub-chart per value (capped at MAX_FACETS).
 */
export function decomposeData(data: ExploreResponse): DecomposeResult {
  const stringCols = data.columns.filter(
    (c) => c.type === "string" && c.name !== "unit" && c.name !== "metric_id",
  );

  if (stringCols.length < 3) {
    return { mode: "single" };
  }

  const facetCol = stringCols[2].name;

  // Collect unique facet values (preserve insertion order, cap at MAX_FACETS)
  const seen = new Set<string>();
  for (const row of data.rows) {
    const v = String(row[facetCol] ?? "");
    seen.add(v);
    if (seen.size >= MAX_FACETS) break;
  }

  const facetValues = Array.from(seen);

  // Build columns without the facet column
  const subColumns = data.columns.filter((c) => c.name !== facetCol);

  const facets: FacetData[] = facetValues.map((val) => ({
    label: val,
    data: {
      columns: subColumns,
      rows: data.rows.filter((r) => String(r[facetCol] ?? "") === val),
      total_rows: 0, // will be set below
      metadata: data.metadata,
    },
  }));

  // Set total_rows for each facet
  facets.forEach((f) => {
    f.data.total_rows = f.data.rows.length;
  });

  const gridCols = facetValues.length <= 4 ? 2 : 3;

  return { mode: "grid", facetColumn: facetCol, facets, gridCols };
}
