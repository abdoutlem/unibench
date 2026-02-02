// Document and file management types

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  path: string;
  folderId: string | null;
  institutionId: string | null;
  fiscalYear: number | null;
  uploadedAt: string;
  uploadedBy: string;
  status: DocumentStatus;
  processingProgress: number;
  extractedMetrics: string[];
  tags: string[];
  notes?: string;
}

export type DocumentType =
  | "pdf"
  | "excel"
  | "word"
  | "powerpoint"
  | "csv"
  | "other";

export type DocumentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  documentCount: number;
  createdAt: string;
  institutionId: string | null;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export interface BulkUploadSession {
  id: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: "in_progress" | "completed" | "failed";
  startedAt: string;
  files: UploadProgress[];
}
