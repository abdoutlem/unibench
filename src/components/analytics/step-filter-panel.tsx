"use client";

import { useState, useEffect } from "react";
import { Search, Check, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ExploreFilters, EntityItem } from "@/types/analytics";

interface Props {
  filters: ExploreFilters;
  onChange: (filters: ExploreFilters) => void;
}

export function StepFilterPanel({ filters, onChange }: Props) {
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [entitySearch, setEntitySearch] = useState("");

  useEffect(() => {
    apiClient
      .getEntities()
      .then((data) =>
        setEntities(
          data.map((e: any) => ({
            entity_id: e.entity_id,
            entity_name: e.entity_name,
            entity_type: e.entity_type,
          }))
        )
      )
      .catch(() => setEntities([]));
  }, []);

  const toggleEntity = (id: string) => {
    const ids = filters.entity_ids.includes(id)
      ? filters.entity_ids.filter((e) => e !== id)
      : [...filters.entity_ids, id];
    onChange({ ...filters, entity_ids: ids });
  };

  const setYearStart = (v: string) => {
    onChange({ ...filters, fiscal_year_start: v ? parseInt(v) : null });
  };

  const setYearEnd = (v: string) => {
    onChange({ ...filters, fiscal_year_end: v ? parseInt(v) : null });
  };

  const filteredEntities = entities.filter((e) =>
    e.entity_name.toLowerCase().includes(entitySearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Fiscal year range */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Fiscal Year Range</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Start"
            className="w-24 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            value={filters.fiscal_year_start ?? ""}
            onChange={(e) => setYearStart(e.target.value)}
            min={2000}
            max={2030}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="number"
            placeholder="End"
            className="w-24 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            value={filters.fiscal_year_end ?? ""}
            onChange={(e) => setYearEnd(e.target.value)}
            min={2000}
            max={2030}
          />
        </div>
      </div>

      {/* Entity selector */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Institutions</p>

        {filters.entity_ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {filters.entity_ids.map((id) => {
              const e = entities.find((e) => e.entity_id === id);
              return (
                <Badge key={id} variant="secondary" className="gap-1 pr-1">
                  {e?.entity_name || id}
                  <button onClick={() => toggleEntity(id)} className="ml-0.5 rounded-full hover:bg-muted p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search institutions..."
            className="w-full rounded-md border border-input bg-background px-8 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            value={entitySearch}
            onChange={(e) => setEntitySearch(e.target.value)}
          />
        </div>

        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {filteredEntities.map((e) => (
            <button
              key={e.entity_id}
              className={cn(
                "flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                filters.entity_ids.includes(e.entity_id) && "bg-primary/8"
              )}
              onClick={() => toggleEntity(e.entity_id)}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                  filters.entity_ids.includes(e.entity_id)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                )}
              >
                {filters.entity_ids.includes(e.entity_id) && <Check className="h-3 w-3" />}
              </div>
              <span className="flex-1 truncate">{e.entity_name}</span>
              <span className="text-[10px] text-muted-foreground">{e.entity_type}</span>
            </button>
          ))}
          {filteredEntities.length === 0 && (
            <p className="text-sm text-muted-foreground py-3 text-center">
              {entities.length === 0 ? "No entities available" : "No match"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
