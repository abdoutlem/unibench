import { create } from "zustand";
import { Document, Folder, UploadProgress, BulkUploadSession } from "@/types/documents";
import { documents as mockDocuments, folders as mockFolders } from "@/data/documents";
import { apiClient, UploadedFile } from "@/lib/api";

interface DocumentsStore {
  documents: Document[];
  folders: Folder[];
  currentFolderId: string | null;
  selectedDocuments: string[];
  uploadSession: BulkUploadSession | null;
  isUploading: boolean;

  // Navigation
  setCurrentFolder: (folderId: string | null) => void;

  // Selection
  selectDocument: (docId: string) => void;
  deselectDocument: (docId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Upload files to backend
  startUpload: (files: File[]) => Promise<void>;
  updateUploadProgress: (fileId: string, progress: number) => void;
  completeUpload: (fileId: string) => void;
  cancelUpload: () => void;

  // Document operations (mock)
  addDocument: (doc: Document) => void;
  deleteDocuments: (docIds: string[]) => void;
  moveDocuments: (docIds: string[], targetFolderId: string) => void;

  // Folder operations
  addFolder: (folder: Folder) => void;
  deleteFolder: (folderId: string) => void;
}

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  documents: mockDocuments,
  folders: mockFolders,
  currentFolderId: null,
  selectedDocuments: [],
  uploadSession: null,
  isUploading: false,

  setCurrentFolder: (folderId) => set({ currentFolderId: folderId, selectedDocuments: [] }),

  selectDocument: (docId) =>
    set((state) => ({
      selectedDocuments: state.selectedDocuments.includes(docId)
        ? state.selectedDocuments
        : [...state.selectedDocuments, docId],
    })),

  deselectDocument: (docId) =>
    set((state) => ({
      selectedDocuments: state.selectedDocuments.filter((id) => id !== docId),
    })),

  selectAll: () =>
    set((state) => {
      const currentDocs = state.documents.filter(
        (d) => d.folderId === state.currentFolderId
      );
      return { selectedDocuments: currentDocs.map((d) => d.id) };
    }),

  clearSelection: () => set({ selectedDocuments: [] }),

  startUpload: async (files) => {
    const uploadFiles: UploadProgress[] = files.map((file, index) => ({
      fileId: `upload-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: "uploading" as const,
    }));

    const session: BulkUploadSession = {
      id: `session-${Date.now()}`,
      totalFiles: files.length,
      completedFiles: 0,
      failedFiles: 0,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      files: uploadFiles,
    };

    set({ uploadSession: session, isUploading: true });

    // Upload files to backend
    const state = get();
    const currentFolderId = state.currentFolderId;

    // Upload files one by one with progress tracking
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const uploadFile = uploadFiles[index];

      try {
        // Update progress
        get().updateUploadProgress(uploadFile.fileId, 10);

        // Upload to backend
        const uploadedFile: UploadedFile = await apiClient.uploadFile(file, currentFolderId || undefined);

        // Update progress
        get().updateUploadProgress(uploadFile.fileId, 90);

        // Create document from uploaded file
        const newDoc: Document = {
          id: uploadedFile.id,
          name: uploadedFile.filename,
          type: getFileType(uploadedFile.filename),
          size: uploadedFile.size,
          path: currentFolderId
            ? state.folders.find((f) => f.id === currentFolderId)?.path || "/"
            : "/",
          folderId: currentFolderId,
          institutionId: null,
          fiscalYear: new Date().getFullYear(),
          uploadedAt: uploadedFile.uploaded_at,
          uploadedBy: "user-001",
          status: "pending",
          processingProgress: 0,
          extractedMetrics: [],
          tags: [],
        };

        // Add document to store
        get().addDocument(newDoc);

        // Mark upload as complete
        get().updateUploadProgress(uploadFile.fileId, 100);
        get().completeUpload(uploadFile.fileId);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        // Mark as error
        const currentState = get();
        if (currentState.uploadSession) {
          const updatedFiles = currentState.uploadSession.files.map((f) =>
            f.fileId === uploadFile.fileId
              ? { ...f, status: "error" as const, error: error instanceof Error ? error.message : "Upload failed" }
              : f
          );
          const failedCount = updatedFiles.filter((f) => f.status === "error").length;
          
          set({
            uploadSession: {
              ...currentState.uploadSession,
              files: updatedFiles,
              failedFiles: failedCount,
              status: failedCount === currentState.uploadSession.totalFiles ? "failed" : "in_progress",
            },
          });
        }
      }
    }
  },

  updateUploadProgress: (fileId, progress) =>
    set((state) => {
      if (!state.uploadSession) return state;
      return {
        uploadSession: {
          ...state.uploadSession,
          files: state.uploadSession.files.map((f) =>
            f.fileId === fileId
              ? { ...f, progress: Math.min(progress, 99), status: "uploading" as const }
              : f
          ),
        },
      };
    }),

  completeUpload: (fileId) =>
    set((state) => {
      if (!state.uploadSession) return state;

      const updatedFiles = state.uploadSession.files.map((f) =>
        f.fileId === fileId ? { ...f, progress: 100, status: "complete" as const } : f
      );

      const completedCount = updatedFiles.filter((f) => f.status === "complete").length;
      const allDone = completedCount === state.uploadSession.totalFiles;

      // Add mock document for completed upload
      const uploadedFile = state.uploadSession.files.find((f) => f.fileId === fileId);
      const newDoc: Document | null = uploadedFile
        ? {
            id: `doc-new-${Date.now()}-${fileId}`,
            name: uploadedFile.fileName,
            type: getFileType(uploadedFile.fileName),
            size: Math.floor(Math.random() * 5000000) + 500000,
            path: state.currentFolderId
              ? state.folders.find((f) => f.id === state.currentFolderId)?.path || "/"
              : "/",
            folderId: state.currentFolderId,
            institutionId: null,
            fiscalYear: new Date().getFullYear(),
            uploadedAt: new Date().toISOString(),
            uploadedBy: "user-001",
            status: "pending",
            processingProgress: 0,
            extractedMetrics: [],
            tags: [],
          }
        : null;

      return {
        uploadSession: {
          ...state.uploadSession,
          files: updatedFiles,
          completedFiles: completedCount,
          status: allDone ? "completed" : "in_progress",
        },
        isUploading: !allDone,
        documents: newDoc ? [...state.documents, newDoc] : state.documents,
      };
    }),

  cancelUpload: () => set({ uploadSession: null, isUploading: false }),

  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc] })),

  deleteDocuments: (docIds) =>
    set((state) => ({
      documents: state.documents.filter((d) => !docIds.includes(d.id)),
      selectedDocuments: [],
    })),

  moveDocuments: (docIds, targetFolderId) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        docIds.includes(d.id) ? { ...d, folderId: targetFolderId } : d
      ),
      selectedDocuments: [],
    })),

  addFolder: (folder) =>
    set((state) => ({ folders: [...state.folders, folder] })),

  deleteFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
      documents: state.documents.filter((d) => d.folderId !== folderId),
    })),
}));

function getFileType(fileName: string): Document["type"] {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "xlsx":
    case "xls":
      return "excel";
    case "docx":
    case "doc":
      return "word";
    case "pptx":
    case "ppt":
      return "powerpoint";
    case "csv":
      return "csv";
    default:
      return "other";
  }
}
