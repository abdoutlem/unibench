"use client";

import { cn } from "@/lib/utils";
import { Download, Maximize2, Tags, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/types/analytics";

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  source?: string;
  chartConfig: ChartConfig;
  onToggleLabels?: () => void;
  onToggleLegend?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  source,
  chartConfig,
  onToggleLabels,
  onToggleLegend,
  children,
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="font-display text-base font-semibold text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {/* Toolbar */}
          <div className="flex items-center gap-1">
            {onToggleLabels && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Toggle data labels"
                onClick={onToggleLabels}
              >
                <Tags className={cn("h-3.5 w-3.5", chartConfig.showDataLabels && "text-primary")} />
              </Button>
            )}
            {onToggleLegend && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Toggle legend"
                onClick={onToggleLegend}
              >
                <BarChart3 className={cn("h-3.5 w-3.5", chartConfig.showLegend && "text-primary")} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Chart body */}
      <div className="flex-1 min-h-0">{children}</div>

      {/* Source annotation */}
      {source && (
        <p className="text-[10px] text-muted-foreground mt-3 tracking-wide uppercase">
          Source: {source}
        </p>
      )}
    </div>
  );
}
