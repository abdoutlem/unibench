"use client";

import { useCallback, useState } from "react";
import { Upload, FolderUp, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocumentsStore } from "@/store";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onClose?: () => void;
}

export function UploadZone({ onClose }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadSession, isUploading, startUpload, cancelUpload } = useDocumentsStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      // Handle both files and folders
      const processEntry = async (entry: FileSystemEntry): Promise<void> => {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          return new Promise((resolve) => {
            fileEntry.file((file) => {
              files.push(file);
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const reader = dirEntry.createReader();
          return new Promise((resolve) => {
            reader.readEntries(async (entries) => {
              for (const entry of entries) {
                await processEntry(entry);
              }
              resolve();
            });
          });
        }
      };

      const processItems = async () => {
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) {
            await processEntry(entry);
          }
        }
        if (files.length > 0) {
          startUpload(files);
        }
      };

      processItems();
    },
    [startUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        startUpload(files);
      }
    },
    [startUpload]
  );

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        startUpload(files);
      }
    },
    [startUpload]
  );

  const completedCount = uploadSession?.files.filter((f) => f.status === "complete").length || 0;
  const totalCount = uploadSession?.totalFiles || 0;

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-6">
        {!isUploading && !uploadSession ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center py-12 rounded-lg transition-colors",
              isDragOver ? "bg-primary/10 border-primary" : "bg-muted/30"
            )}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Drop files or folders here
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Upload PDF, Excel, Word, PowerPoint, or CSV files.
              <br />
              You can also drag entire folders for bulk import.
            </p>
            <div className="flex gap-3">
              <Button variant="default" className="relative">
                <Upload className="h-4 w-4 mr-2" />
                Select Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv"
                />
              </Button>
              <Button variant="outline" className="relative">
                <FolderUp className="h-4 w-4 mr-2" />
                Select Folder
                <input
                  type="file"
                  // @ts-expect-error - webkitdirectory is not in types
                  webkitdirectory=""
                  multiple
                  onChange={handleFolderSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {uploadSession?.status === "completed" ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {uploadSession?.status === "completed"
                      ? "Upload Complete"
                      : "Uploading Files..."}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {completedCount} of {totalCount} files uploaded
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadSession?.status === "completed" && onClose && (
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Done
                  </Button>
                )}
                {uploadSession?.status !== "completed" && (
                  <Button variant="ghost" size="sm" onClick={cancelUpload}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>

            {/* File list */}
            <div className="max-h-64 overflow-auto space-y-2">
              {uploadSession?.files.map((file) => (
                <div
                  key={file.fileId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {file.status === "complete" ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : file.status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    )}
                    <span className="text-sm truncate">{file.fileName}</span>
                  </div>
                  <Badge
                    variant={
                      file.status === "complete"
                        ? "high"
                        : file.status === "error"
                        ? "low"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {file.status === "complete"
                      ? "Done"
                      : file.status === "error"
                      ? "Failed"
                      : `${Math.round(file.progress)}%`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
