import { IngestionSource } from "@/types/platform";

export const ingestionSources: IngestionSource[] = [
  // 1. IPEDS Data Center
  {
    id: "source-001",
    name: "IPEDS Data Center",
    type: "url",
    url: "https://nces.ed.gov/ipeds/datacenter",
    schedule: "0 0 1 */3 *",
    last_run_at: "2024-09-01T00:00:00Z",
    next_run_at: "2024-12-01T00:00:00Z",
    status: "active",
    metrics_count: 45,
    description:
      "Integrated Postsecondary Education Data System. Quarterly scrape of institutional data including enrollment, completions, financial aid, human resources, and institutional characteristics.",
  },

  // 2. Common Data Set Initiative
  {
    id: "source-002",
    name: "Common Data Set Initiative",
    type: "url",
    url: "https://commondataset.org",
    schedule: "0 0 15 9 *",
    last_run_at: "2024-09-15T00:00:00Z",
    next_run_at: "2025-09-15T00:00:00Z",
    status: "active",
    metrics_count: 30,
    description:
      "Annual collection of standardized institutional data. Covers admissions, enrollment, academic offerings, financial aid, and class sizes. Scraped each September when institutions publish updated CDS reports.",
  },

  // 3. NACUBO Endowment Study
  {
    id: "source-003",
    name: "NACUBO Endowment Study",
    type: "url",
    url: "https://www.nacubo.org/Research/NACUBO-Endowment-Study",
    schedule: "0 0 1 2 *",
    last_run_at: "2024-02-01T00:00:00Z",
    next_run_at: "2025-02-01T00:00:00Z",
    status: "paused",
    metrics_count: 5,
    description:
      "Annual endowment data published by NACUBO-TIAA. Includes endowment market value, returns, spending rates, and asset allocation. Currently paused due to page structure changes requiring parser updates.",
  },

  // 4. US News Rankings
  {
    id: "source-004",
    name: "US News Best Colleges Rankings",
    type: "url",
    url: "https://www.usnews.com/best-colleges/rankings/national-universities",
    schedule: "0 0 10 9 *",
    last_run_at: "2024-09-10T00:00:00Z",
    next_run_at: "2025-09-10T00:00:00Z",
    status: "active",
    metrics_count: 12,
    description:
      "Annual rankings of national universities. Extracts overall rank, peer assessment score, graduation rate, faculty resources, financial resources, alumni giving, and other ranking indicators.",
  },

  // 5. Internal Document Repository
  {
    id: "source-005",
    name: "Internal Document Repository",
    type: "document_upload",
    status: "active",
    metrics_count: 28,
    description:
      "Internal repository for uploaded institutional documents including annual financial reports, board presentations, budget summaries, enrollment reports, and research expenditure summaries. Documents are uploaded manually and processed through the extraction pipeline.",
  },

  // 6. NSF HERD Survey
  {
    id: "source-006",
    name: "NSF HERD Survey",
    type: "url",
    url: "https://ncses.nsf.gov/surveys/higher-education-research-development",
    schedule: "0 0 15 1 *",
    last_run_at: "2024-01-15T00:00:00Z",
    next_run_at: "2025-01-15T00:00:00Z",
    status: "active",
    metrics_count: 8,
    description:
      "National Science Foundation Higher Education Research and Development Survey. Annual data on R&D expenditures by source of funding, field of research, and institution type. Published each January with a two-year reporting lag.",
  },

  // 7. Manual Data Entry Portal
  {
    id: "source-007",
    name: "Manual Data Entry Portal",
    type: "manual_entry",
    status: "active",
    metrics_count: 15,
    description:
      "Portal for manually entering institutional metrics that are not available through automated scraping or document uploads. Supports direct entry of key performance indicators with built-in validation and approval workflows.",
  },

  // 8. State Higher Education Finance (SHEF)
  {
    id: "source-008",
    name: "State Higher Education Finance (SHEF)",
    type: "url",
    url: "https://shef.sheeo.org/data-downloads",
    schedule: "0 0 1 3 *",
    last_run_at: "2024-03-01T00:00:00Z",
    next_run_at: "2025-03-01T00:00:00Z",
    status: "disabled",
    metrics_count: 10,
    description:
      "SHEEO State Higher Education Finance report. Annual data on state and local funding for higher education, educational appropriations per FTE, net tuition revenue, and state fiscal support. Currently disabled pending license review for automated access.",
  },
];

// Helper: filter sources by type
export const getSourcesByType = (type: string): IngestionSource[] =>
  ingestionSources.filter((source) => source.type === type);

// Helper: filter sources by status
export const getSourcesByStatus = (status: string): IngestionSource[] =>
  ingestionSources.filter((source) => source.status === status);
