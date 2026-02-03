"use client";

import { useState, useMemo } from "react";
import type { ExploreResponse } from "@/types/analytics";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  data: ExploreResponse;
}

export function AnalyticsTableView({ data }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const columns = data.columns.filter((c) => c.name !== "unit");

  const sorted = useMemo(() => {
    if (!sortCol) return data.rows;
    return [...data.rows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data.rows, sortCol, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  // Find min/max for numeric columns for conditional formatting
  const numericRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    columns
      .filter((c) => c.type === "number")
      .forEach((c) => {
        const vals = data.rows.map((r) => r[c.name]).filter((v) => v != null) as number[];
        if (vals.length) {
          ranges[c.name] = { min: Math.min(...vals), max: Math.max(...vals) };
        }
      });
    return ranges;
  }, [data.rows, columns]);

  const getHeatColor = (col: string, val: number): string | undefined => {
    const range = numericRanges[col];
    if (!range || range.max === range.min) return undefined;
    const pct = (val - range.min) / (range.max - range.min);
    const alpha = 0.06 + pct * 0.14;
    return `hsla(210, 55%, 40%, ${alpha})`;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort(col.name)}
                >
                  <span className="flex items-center gap-1">
                    {col.name.replace(/_/g, " ")}
                    {sortCol === col.name ? (
                      sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                {columns.map((col) => {
                  const val = row[col.name];
                  const bg = col.type === "number" && val != null ? getHeatColor(col.name, val as number) : undefined;
                  return (
                    <td
                      key={col.name}
                      className={cn("px-3 py-2", col.type === "number" && "text-right tabular-nums")}
                      style={bg ? { backgroundColor: bg } : undefined}
                    >
                      {val != null
                        ? col.type === "number"
                          ? Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : col.type === "date"
                          ? new Date(String(val)).toLocaleDateString()
                          : String(val)
                        : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
          <span>
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="px-2 py-1 rounded hover:bg-accent disabled:opacity-40"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 rounded hover:bg-accent disabled:opacity-40"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
