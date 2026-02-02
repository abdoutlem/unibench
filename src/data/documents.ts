import { Document, Folder, DocumentType, DocumentStatus } from "@/types/documents";

// Mock folders structure
export const folders: Folder[] = [
  {
    id: "folder-root",
    name: "All Documents",
    parentId: null,
    path: "/",
    documentCount: 24,
    createdAt: "2024-01-15",
    institutionId: null,
  },
  {
    id: "folder-fy2024",
    name: "FY 2024",
    parentId: "folder-root",
    path: "/FY 2024",
    documentCount: 8,
    createdAt: "2024-01-15",
    institutionId: null,
  },
  {
    id: "folder-fy2023",
    name: "FY 2023",
    parentId: "folder-root",
    path: "/FY 2023",
    documentCount: 10,
    createdAt: "2023-01-10",
    institutionId: null,
  },
  {
    id: "folder-fy2022",
    name: "FY 2022",
    parentId: "folder-root",
    path: "/FY 2022",
    documentCount: 6,
    createdAt: "2022-01-12",
    institutionId: null,
  },
  {
    id: "folder-suny",
    name: "SUNY Buffalo",
    parentId: "folder-fy2024",
    path: "/FY 2024/SUNY Buffalo",
    documentCount: 3,
    createdAt: "2024-02-01",
    institutionId: "inst-001",
  },
  {
    id: "folder-utaustin",
    name: "UT Austin",
    parentId: "folder-fy2024",
    path: "/FY 2024/UT Austin",
    documentCount: 2,
    createdAt: "2024-02-01",
    institutionId: "inst-002",
  },
];

// Mock documents
export const documents: Document[] = [
  {
    id: "doc-001",
    name: "Annual Financial Report FY2024.pdf",
    type: "pdf",
    size: 4500000,
    path: "/FY 2024/SUNY Buffalo",
    folderId: "folder-suny",
    institutionId: "inst-001",
    fiscalYear: 2024,
    uploadedAt: "2024-09-15T10:30:00Z",
    uploadedBy: "user-001",
    status: "completed",
    processingProgress: 100,
    extractedMetrics: ["metric-total-revenue", "metric-tuition-revenue", "metric-endowment"],
    tags: ["financial", "annual-report"],
  },
  {
    id: "doc-002",
    name: "Board Presentation Q4.pptx",
    type: "powerpoint",
    size: 12000000,
    path: "/FY 2024/SUNY Buffalo",
    folderId: "folder-suny",
    institutionId: "inst-001",
    fiscalYear: 2024,
    uploadedAt: "2024-09-10T14:20:00Z",
    uploadedBy: "user-001",
    status: "completed",
    processingProgress: 100,
    extractedMetrics: ["metric-total-enrollment", "metric-retention-rate"],
    tags: ["board", "quarterly"],
  },
  {
    id: "doc-003",
    name: "Enrollment Data Fall 2024.xlsx",
    type: "excel",
    size: 850000,
    path: "/FY 2024/SUNY Buffalo",
    folderId: "folder-suny",
    institutionId: "inst-001",
    fiscalYear: 2024,
    uploadedAt: "2024-09-20T09:15:00Z",
    uploadedBy: "user-002",
    status: "processing",
    processingProgress: 65,
    extractedMetrics: [],
    tags: ["enrollment", "fall"],
  },
  {
    id: "doc-004",
    name: "Research Expenditures Summary.pdf",
    type: "pdf",
    size: 2200000,
    path: "/FY 2024/UT Austin",
    folderId: "folder-utaustin",
    institutionId: "inst-002",
    fiscalYear: 2024,
    uploadedAt: "2024-08-25T11:00:00Z",
    uploadedBy: "user-001",
    status: "completed",
    processingProgress: 100,
    extractedMetrics: ["metric-research-expenditure"],
    tags: ["research", "summary"],
  },
  {
    id: "doc-005",
    name: "Facilities Assessment Report.docx",
    type: "word",
    size: 3800000,
    path: "/FY 2024/UT Austin",
    folderId: "folder-utaustin",
    institutionId: "inst-002",
    fiscalYear: 2024,
    uploadedAt: "2024-07-18T16:45:00Z",
    uploadedBy: "user-002",
    status: "needs_review",
    processingProgress: 100,
    extractedMetrics: ["metric-deferred-maintenance"],
    tags: ["facilities", "assessment"],
    notes: "Some values need manual verification",
  },
  {
    id: "doc-006",
    name: "Budget Projections FY2025.xlsx",
    type: "excel",
    size: 1200000,
    path: "/FY 2024",
    folderId: "folder-fy2024",
    institutionId: null,
    fiscalYear: 2025,
    uploadedAt: "2024-06-01T08:30:00Z",
    uploadedBy: "user-001",
    status: "pending",
    processingProgress: 0,
    extractedMetrics: [],
    tags: ["budget", "projections"],
  },
  {
    id: "doc-007",
    name: "Historical Enrollment Trends.csv",
    type: "csv",
    size: 450000,
    path: "/FY 2023",
    folderId: "folder-fy2023",
    institutionId: null,
    fiscalYear: 2023,
    uploadedAt: "2023-12-10T13:20:00Z",
    uploadedBy: "user-001",
    status: "completed",
    processingProgress: 100,
    extractedMetrics: ["metric-total-enrollment", "metric-undergrad-enrollment", "metric-grad-enrollment"],
    tags: ["enrollment", "historical"],
  },
  {
    id: "doc-008",
    name: "Consolidated Financial Statements.pdf",
    type: "pdf",
    size: 8500000,
    path: "/FY 2023",
    folderId: "folder-fy2023",
    institutionId: null,
    fiscalYear: 2023,
    uploadedAt: "2023-11-15T10:00:00Z",
    uploadedBy: "user-002",
    status: "failed",
    processingProgress: 35,
    extractedMetrics: [],
    tags: ["financial", "consolidated"],
    notes: "File appears corrupted, please re-upload",
  },
];

// Helper functions
export const getDocumentsByFolder = (folderId: string | null) =>
  documents.filter((d) => d.folderId === folderId);

export const getDocumentsByInstitution = (institutionId: string) =>
  documents.filter((d) => d.institutionId === institutionId);

export const getDocumentsByStatus = (status: DocumentStatus) =>
  documents.filter((d) => d.status === status);

export const getFoldersByParent = (parentId: string | null) =>
  folders.filter((f) => f.parentId === parentId);

export const getDocumentById = (id: string) =>
  documents.find((d) => d.id === id);

export const getFolderById = (id: string) =>
  folders.find((f) => f.id === id);

export const getDocumentTypeIcon = (type: DocumentType): string => {
  switch (type) {
    case "pdf":
      return "file-text";
    case "excel":
    case "csv":
      return "file-spreadsheet";
    case "word":
      return "file-text";
    case "powerpoint":
      return "presentation";
    default:
      return "file";
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
