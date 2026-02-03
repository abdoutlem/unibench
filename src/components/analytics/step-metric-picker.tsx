"use client";

import { useState, useEffect } from "react";
import { Search, Check, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

interface MetricItem {
  id: string;
  canonical_name: string;
  category?: string;
  unit?: string;
  domain?: string;
}

export function StepMetricPicker({ selected, onChange }: Props) {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getGlossaryMetrics()
      .then((data) => {
        setMetrics(
          data.map((m: any) => ({
            id: m.id || m.metric_id,
            canonical_name: m.canonical_name || m.name,
            category: m.category || m.domain,
            unit: m.unit,
            domain: m.domain,
          }))
        );
      })
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = metrics.filter(
    (m) =>
      m.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.category || "").toLowerCase().includes(search.toLowerCase())
  );

  // Group by domain/category
  const grouped: Record<string, MetricItem[]> = {};
  filtered.forEach((m) => {
    const key = m.domain || m.category || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-3">
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const m = metrics.find((m) => m.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {m?.canonical_name || id}
                <button
                  onClick={() => toggle(id)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search metrics..."
          className="w-full rounded-md border border-input bg-background px-8 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="max-h-56 overflow-y-auto space-y-3">
        {loading && <p className="text-sm text-muted-foreground py-4 text-center">Loading metrics...</p>}
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 px-1">
              {group}
            </p>
            {items.map((m) => (
              <button
                key={m.id}
                className={cn(
                  "flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                  selected.includes(m.id) && "bg-primary/8"
                )}
                onClick={() => toggle(m.id)}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                    selected.includes(m.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {selected.includes(m.id) && <Check className="h-3 w-3" />}
                </div>
                <span className="flex-1 truncate">{m.canonical_name}</span>
                {m.unit && (
                  <span className="text-[10px] text-muted-foreground">{m.unit}</span>
                )}
              </button>
            ))}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No metrics found</p>
        )}
      </div>
    </div>
  );
}
