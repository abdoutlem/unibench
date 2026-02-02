"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({
  value,
  onValueChange,
  placeholder = "Select...",
  options,
  className,
}: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
    </div>
  );
}

interface MultiSelectProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
}

export function MultiSelect({
  values,
  onValuesChange,
  placeholder = "Select...",
  options,
  className,
}: MultiSelectProps) {
  const handleToggle = (value: string) => {
    if (values.includes(value)) {
      onValuesChange(values.filter((v) => v !== value));
    } else {
      onValuesChange([...values, value]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1">
        {values.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          values.map((value) => {
            const option = options.find((o) => o.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {option?.label || value}
                <button
                  type="button"
                  onClick={() => handleToggle(value)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {options
          .filter((o) => !values.includes(o.value))
          .map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className="rounded-md border border-dashed border-input px-2 py-1 text-xs hover:bg-accent"
            >
              + {option.label}
            </button>
          ))}
      </div>
    </div>
  );
}
