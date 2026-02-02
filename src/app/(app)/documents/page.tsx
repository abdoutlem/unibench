"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UploadZone,
  DocumentList,
  DocumentDetail,
  ExtractDialog,
} from "@/components/documents";
import { useDocumentsStore } from "@/store";
import { Document, DocumentStatus } from "@/types/documents";
import {
  FileStack,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  Filter,
  Sparkles,
} from "lucide-react";

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [extractFileId, setExtractFileId] = useState<string | null>(null);
  const [extractDocument, setExtractDocument] = useState<Document | null>(null);

  const { documents, isUploading, uploadSession } = useDocumentsStore();

  // Calculate stats
  const stats = {
    total: documents.length,
    completed: documents.filter((d) => d.status === "completed").length,
    processing: documents.filter((d) => d.status === "processing").length,
    pending: documents.filter((d) => d.status === "pending").length,
    needsReview: documents.filter((d) => d.status === "needs_review").length,
    failed: documents.filter((d) => d.status === "failed").length,
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleExtract = async (doc: Document) => {
    // Use document ID as file ID (assuming document ID matches uploaded file ID)
    setExtractFile(null);
    setExtractDocument(doc);
    // Store the document ID to use as fileId
    setExtractFileId(doc.id);
  };

  const handleExtractSuccess = (job: any) => {
    console.log("Extraction completed:", job);
    // You could update the document with extracted metrics here
    setExtractFile(null);
    setExtractDocument(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileStack className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Upload and manage internal data sources
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Upload zone */}
      {(showUpload || isUploading) && (
        <UploadZone
          onClose={() => {
            if (uploadSession?.status === "completed") {
              setShowUpload(false);
            }
          }}
        />
      )}

      {/* Extract Dialog */}
      {(extractFile || extractFileId) && (
        <ExtractDialog
          file={extractFile}
          fileId={extractFileId || undefined}
          onClose={() => {
            setExtractFile(null);
            setExtractFileId(null);
            setExtractDocument(null);
          }}
          onSuccess={handleExtractSuccess}
        />
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileStack className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.processing}</div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.needsReview}</div>
                <div className="text-sm text-muted-foreground">Needs Review</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileStack className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Internal Knowledge Base</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload financial reports, board presentations, enrollment data, and other
                internal documents. These files will be processed to extract metrics and
                populate the internal portfolio data. Supported formats: PDF, Excel, Word,
                PowerPoint, CSV.
              </p>
            </div>
            <Badge variant="internal">Internal Data</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="flex gap-6">
        <div className={selectedDocument ? "flex-1" : "w-full"}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Files</TabsTrigger>
                <TabsTrigger value="processed">
                  Processed
                  {stats.completed > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {stats.completed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {stats.pending + stats.processing > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {stats.pending + stats.processing}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="review">
                  Needs Review
                  {stats.needsReview > 0 && (
                    <Badge variant="medium" className="ml-2 text-xs">
                      {stats.needsReview}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <TabsContent value="all">
              <DocumentList
                onDocumentClick={handleDocumentClick}
                onExtract={handleExtract}
              />
            </TabsContent>

            <TabsContent value="processed">
              <DocumentList
                onDocumentClick={handleDocumentClick}
                onExtract={handleExtract}
              />
            </TabsContent>

            <TabsContent value="pending">
              <DocumentList
                onDocumentClick={handleDocumentClick}
                onExtract={handleExtract}
              />
            </TabsContent>

            <TabsContent value="review">
              <DocumentList
                onDocumentClick={handleDocumentClick}
                onExtract={handleExtract}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Document detail panel */}
        {selectedDocument && (
          <div className="w-96 shrink-0">
            <DocumentDetail
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
