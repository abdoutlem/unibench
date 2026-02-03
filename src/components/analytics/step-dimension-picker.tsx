"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  selected: string[];
  onChange: (dims: string[]) => void;
}

interface DimensionItem {
  id: string;
  name: string;
  description?: string;
}

// Built-in virtual dimensions that don't come from the dimensions table
const VIRTUAL_DIMENSIONS: DimensionItem[] = [
  { id: "entity_id", name: "Entity", description: "Group by institution" },
  { id: "fiscal_year", name: "Fiscal Year", description: "Group by year" },
  { id: "metric_id", name: "Metric", description: "Group by metric" },
];

export function StepDimensionPicker({ selected, onChange }: Props) {
  const [dimensions, setDimensions] = useState<DimensionItem[]>(VIRTUAL_DIMENSIONS);

  useEffect(() => {
    apiClient
      .getGlossaryDimensions()
      .then((data) => {
        const dbDims: DimensionItem[] = data.map((d: any) => ({
          id: d.dimension_name || d.name || d.id,
          name: d.dimension_name || d.name,
          description: d.description,
        }));
        setDimensions([...VIRTUAL_DIMENSIONS, ...dbDims]);
      })
      .catch(() => {});
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const d = dimensions.find((d) => d.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {d?.name || id}
                <button onClick={() => toggle(id)} className="ml-0.5 rounded-full hover:bg-muted p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <div className="space-y-0.5">
        {dimensions.map((d) => (
          <button
            key={d.id}
            className={cn(
              "flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
              selected.includes(d.id) && "bg-primary/8"
            )}
            onClick={() => toggle(d.id)}
          >
            <div
              className={cn(
                "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                selected.includes(d.id)
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-input"
              )}
            >
              {selected.includes(d.id) && <Check className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="truncate">{d.name}</span>
              {d.description && (
                <span className="text-[11px] text-muted-foreground ml-2">{d.description}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
