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
  UrlsList,
  DataSourceDetail,
} from "@/components/documents";
import { useDocumentsStore } from "@/store";
import { Document, DataSource } from "@/types/documents";
import {
  FileStack,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  Filter,
  Globe,
  Database,
} from "lucide-react";

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState("documents");
  const [activeTab, setActiveTab] = useState("all");
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [extractFileId, setExtractFileId] = useState<string | null>(null);
  const [extractDocument, setExtractDocument] = useState<Document | null>(null);

  const { documents, isUploading, uploadSession } = useDocumentsStore();

  // Calculate stats for documents
  const documentStats = {
    total: documents.length,
    completed: documents.filter((d) => d.status === "completed").length,
    processing: documents.filter((d) => d.status === "processing").length,
    pending: documents.filter((d) => d.status === "pending").length,
    needsReview: documents.filter((d) => d.status === "needs_review").length,
    failed: documents.filter((d) => d.status === "failed").length,
  };

  // Mock data source stats (replace with real data)
  const dataSourceStats = {
    total: 15,
    active: 12,
    inactive: 2,
    error: 1,
    documents: documentStats.total,
    urls: 3,
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

  const handleUrlClick = (url: DataSource) => {
    setSelectedDataSource(url);
    setSelectedDocument(null);
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
    setSelectedDataSource(null);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-internal/10">
            <FileStack className="h-4.5 w-4.5 text-internal" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Data Sources</h1>
            <p className="text-sm text-muted-foreground">
              Manage documents, URLs, and data source configurations
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sources</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{dataSourceStats.total}</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Active</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{dataSourceStats.active}</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-internal uppercase tracking-wider">Documents</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{dataSourceStats.documents}</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">URL Sources</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{dataSourceStats.urls}</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inactive</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{dataSourceStats.inactive}</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-rose-600 uppercase tracking-wider">Errors</div>
            <div className="mt-1 text-2xl font-display font-semibold font-data">{dataSourceStats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <Card className="border-l-2 border-l-internal">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm">Data Sources Management</h3>
                <Badge variant="internal">Internal Data</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage all your data sources including uploaded documents and URL-based sources.
                Configure update frequencies, extraction rules, and monitor status. Documents
                support PDF, Excel, Word, PowerPoint, and CSV formats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content with source type tabs */}
      <div className="flex gap-6">
        <div className={selectedDocument || selectedDataSource ? "flex-1" : "w-full"}>
          <Tabs value={activeSourceTab} onValueChange={setActiveSourceTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="documents">
                <FileStack className="h-4 w-4 mr-2" />
                Documents
                {documentStats.total > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {documentStats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="urls">
                <Globe className="h-4 w-4 mr-2" />
                URLs
                {dataSourceStats.urls > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {dataSourceStats.urls}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All Files</TabsTrigger>
                    <TabsTrigger value="processed">
                      Processed
                      {documentStats.completed > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {documentStats.completed}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      {documentStats.pending + documentStats.processing > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {documentStats.pending + documentStats.processing}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="review">
                      Needs Review
                      {documentStats.needsReview > 0 && (
                        <Badge variant="medium" className="ml-2 text-xs">
                          {documentStats.needsReview}
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
            </TabsContent>

            <TabsContent value="urls">
              <UrlsList
                onUrlClick={handleUrlClick}
                onConfigure={(url) => {
                  setSelectedDataSource(url);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail panel */}
        {selectedDocument && (
          <div className="w-96 shrink-0">
            <DocumentDetail
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
            />
          </div>
        )}
        {selectedDataSource && (
          <div className="w-96 shrink-0">
            <DataSourceDetail
              dataSource={selectedDataSource}
              onClose={() => setSelectedDataSource(null)}
              onConfigure={() => {
                // Handle configuration dialog
                console.log("Configure data source:", selectedDataSource);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
