"use client";

import { formatDistanceToNow } from "date-fns";
import {
  BarChart3, LineChart as LineIcon, AreaChart as AreaIcon,
  PieChart as PieIcon, Table2, MoreVertical, Pencil, Copy, Trash2, ExternalLink,
  Layers, BarChartHorizontal, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SavedReport, ChartType } from "@/types/analytics";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  report: SavedReport;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const CHART_ICONS: Record<ChartType, React.ElementType> = {
  bar: BarChart3,
  bar_horizontal: BarChartHorizontal,
  line: LineIcon,
  area: AreaIcon,
  stacked_bar: Layers,
  pie: PieIcon,
  donut: Circle,
  table: Table2,
};

export function ReportCard({ report, onOpen, onEdit, onDuplicate, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = CHART_ICONS[report.chart_type] || BarChart3;

  const metricCount = report.query_config?.metric_ids?.length ?? 0;

  return (
    <Card className="group relative hover:shadow-md transition-shadow cursor-pointer" onClick={onOpen}>
      <div className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{report.title}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(report.updated_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-40 rounded-md border bg-popover shadow-lg py-1">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onOpen(); }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(); }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {report.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {metricCount} metric{metricCount !== 1 ? "s" : ""}
          </Badge>
          {report.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
