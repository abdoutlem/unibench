"use client";

import {
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  FileType,
} from "lucide-react";
import { DocumentType } from "@/types/documents";
import { cn } from "@/lib/utils";

interface FileIconProps {
  type: DocumentType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

const typeColors: Record<DocumentType, string> = {
  pdf: "text-red-500",
  excel: "text-green-600",
  csv: "text-green-500",
  word: "text-blue-600",
  powerpoint: "text-orange-500",
  other: "text-gray-500",
};

export function FileIcon({ type, className, size = "md" }: FileIconProps) {
  const Icon = getIconComponent(type);
  return (
    <Icon
      className={cn(sizeClasses[size], typeColors[type], className)}
    />
  );
}

function getIconComponent(type: DocumentType) {
  switch (type) {
    case "pdf":
      return FileText;
    case "excel":
    case "csv":
      return FileSpreadsheet;
    case "word":
      return FileType;
    case "powerpoint":
      return Presentation;
    default:
      return File;
  }
}
