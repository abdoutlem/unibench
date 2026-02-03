"use client";

import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/types/platform";
import { Check, Loader2, X, SkipForward, Circle } from "lucide-react";

const stepStatusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  completed: {
    color: "bg-green-500",
    icon: <Check className="h-3 w-3 text-white" />,
  },
  running: {
    color: "bg-blue-500",
    icon: <Loader2 className="h-3 w-3 text-white animate-spin" />,
  },
  failed: {
    color: "bg-red-500",
    icon: <X className="h-3 w-3 text-white" />,
  },
  skipped: {
    color: "bg-gray-300",
    icon: <SkipForward className="h-3 w-3 text-gray-600" />,
  },
  pending: {
    color: "bg-gray-200",
    icon: <Circle className="h-3 w-3 text-gray-400" />,
  },
};

interface PipelineStatusBarProps {
  steps: PipelineStep[];
  compact?: boolean;
  className?: string;
}

export function PipelineStatusBar({
  steps,
  compact = false,
  className,
}: PipelineStatusBarProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {steps.map((step, i) => {
          const config = stepStatusConfig[step.status] || stepStatusConfig.pending;
          return (
            <div
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", config.color)}
              title={`${step.step_name}: ${step.status}`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const config = stepStatusConfig[step.status] || stepStatusConfig.pending;
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  config.color
                )}
              >
                {config.icon}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground whitespace-nowrap max-w-[60px] truncate">
                {step.step_name.replace(/_/g, " ")}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 w-6 mx-0.5",
                  step.status === "completed" ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
