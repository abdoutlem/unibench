"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Trash2,
  FolderInput,
  Eye,
  Download,
  CheckSquare,
  Square,
  Folder,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FileIcon } from "./file-icon";
import { useDocumentsStore } from "@/store";
import { Document, Folder as FolderType, DocumentStatus } from "@/types/documents";
import { formatFileSize } from "@/data/documents";
import { cn } from "@/lib/utils";

interface DocumentListProps {
  onDocumentClick?: (doc: Document) => void;
  onExtract?: (doc: Document) => void;
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; variant: "high" | "medium" | "low" | "secondary" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "medium" },
  completed: { label: "Processed", variant: "high" },
  failed: { label: "Failed", variant: "low" },
  needs_review: { label: "Needs Review", variant: "medium" },
};

export function DocumentList({ onDocumentClick, onExtract }: DocumentListProps) {
  const {
    documents,
    folders,
    currentFolderId,
    selectedDocuments,
    setCurrentFolder,
    selectDocument,
    deselectDocument,
    selectAll,
    clearSelection,
    deleteDocuments,
  } = useDocumentsStore();

  const [showActions, setShowActions] = useState<string | null>(null);

  // Get current folder info
  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  // Get subfolders and documents for current view
  const subfolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentDocuments = documents.filter((d) => d.folderId === currentFolderId);

  // Build breadcrumb
  const buildBreadcrumb = () => {
    const crumbs: { id: string | null; name: string }[] = [
      { id: null, name: "All Documents" },
    ];
    if (currentFolder) {
      let folder: FolderType | undefined = currentFolder;
      const path: FolderType[] = [];
      while (folder) {
        path.unshift(folder);
        folder = folders.find((f) => f.id === folder?.parentId);
      }
      path.forEach((f) => crumbs.push({ id: f.id, name: f.name }));
    }
    return crumbs;
  };

  const breadcrumb = buildBreadcrumb();

  const toggleSelect = (docId: string) => {
    if (selectedDocuments.includes(docId)) {
      deselectDocument(docId);
    } else {
      selectDocument(docId);
    }
  };

  const handleDelete = () => {
    if (selectedDocuments.length > 0) {
      deleteDocuments(selectedDocuments);
    }
  };

  const allSelected =
    currentDocuments.length > 0 &&
    currentDocuments.every((d) => selectedDocuments.includes(d.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Breadcrumb */}
            {breadcrumb.map((crumb, index) => (
              <div key={crumb.id || "root"} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <button
                  onClick={() => setCurrentFolder(crumb.id)}
                  className={cn(
                    "text-sm hover:text-primary transition-colors",
                    index === breadcrumb.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Bulk actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedDocuments.length} selected
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  onClick={() => (allSelected ? clearSelection() : selectAll())}
                  className="p-1 hover:bg-muted rounded"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Folders first */}
            {subfolders.map((folder) => (
              <TableRow
                key={folder.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setCurrentFolder(folder.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="w-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {folder.documentCount} items
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(folder.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}

            {/* Documents */}
            {currentDocuments.map((doc) => {
              const isSelected = selectedDocuments.includes(doc.id);
              const status = statusConfig[doc.status];

              return (
                <TableRow
                  key={doc.id}
                  className={cn(
                    "cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleSelect(doc.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell onClick={() => onDocumentClick?.(doc)}>
                    <div className="flex items-center gap-3">
                      <FileIcon type={doc.type} />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        {doc.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{doc.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                      {doc.status === "processing" && (
                        <span className="text-xs text-muted-foreground">
                          {doc.processingProgress}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatFileSize(doc.size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {doc.extractedMetrics.length > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {doc.extractedMetrics.length} metrics
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActions(showActions === doc.id ? null : doc.id);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {showActions === doc.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-card shadow-lg z-10">
                          <div className="p-1">
                            <button
                              onClick={() => onDocumentClick?.(doc)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" /> View Details
                            </button>
                            {onExtract && (
                              <button
                                onClick={() => {
                                  onExtract(doc);
                                  setShowActions(null);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                              >
                                <Sparkles className="h-4 w-4" /> Extract Data
                              </button>
                            )}
                            <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                              <Download className="h-4 w-4" /> Download
                            </button>
                            <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                              <FolderInput className="h-4 w-4" /> Move
                            </button>
                            <button
                              onClick={() => {
                                deleteDocuments([doc.id]);
                                setShowActions(null);
                              }}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-muted"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {subfolders.length === 0 && currentDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No documents in this folder</p>
                    <p className="text-sm">Upload files to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
