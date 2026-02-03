import type { GroundingVerification, GroundingCheck } from "@/types/platform";

// -------------------------------------------------------------------
// Mock grounding verification data
// Covers: 8 verified, 3 uncertain, 2 hallucination, 2 needs_review
//
// Entity mappings:
//   inst-001 = State University of New York at Buffalo (SUNY Buffalo)
//   inst-002 = University of Texas at Austin (UT Austin)
//   inst-003 = University of Michigan
//   inst-004 = University of California, Berkeley (UC Berkeley)
//   inst-005 = Ohio State University
// -------------------------------------------------------------------

function makeChecks(
  identity: { passed: boolean; detail: string },
  fidelity: { passed: boolean; detail: string },
  relevance: { passed: boolean; detail: string },
): GroundingCheck[] {
  return [
    {
      check_name: "metric_identity",
      passed: identity.passed,
      detail: identity.detail,
    },
    {
      check_name: "value_fidelity",
      passed: fidelity.passed,
      detail: fidelity.detail,
    },
    {
      check_name: "context_relevance",
      passed: relevance.passed,
      detail: relevance.detail,
    },
  ];
}

export const groundingVerifications: GroundingVerification[] = [
  // =====================================================================
  // VERIFIED (8 records, all 3 checks pass, confidence 0.85 - 0.98)
  // =====================================================================

  // gv-001: Total Operating Revenue for SUNY Buffalo
  {
    id: "gv-001",
    observation_id: "obs-rev-001",
    metric_id: "met-fin-001",
    metric_name: "Total Operating Revenue",
    entity_id: "inst-001",
    entity_name: "State University of New York at Buffalo",
    extracted_value: 1892450000,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-001",
    source_document_name: "Annual Financial Report FY2024",
    source_page: 12,
    source_text_excerpt:
      "For the fiscal year ended June 30, 2024, total operating revenues were $1,892,450,000, representing a 4.2% increase over the prior year.",
    verification_checks: makeChecks(
      { passed: true, detail: "Revenue metric correctly identified from financial statements header" },
      { passed: true, detail: "Extracted value $1,892,450,000 matches source text exactly" },
      { passed: true, detail: "Text appears in audited financial statements section" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.97,
    verified_at: "2024-09-10T14:22:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-002: First-Year Retention Rate for UT Austin
  {
    id: "gv-002",
    observation_id: "obs-ret-002",
    metric_id: "met-acad-003",
    metric_name: "First-Year Retention Rate",
    entity_id: "inst-002",
    entity_name: "University of Texas at Austin",
    extracted_value: 93.2,
    unit: "%",
    fiscal_year: 2024,
    source_document_id: "doc-002",
    source_document_name: "CDS UT Austin 2024",
    source_page: 8,
    source_text_excerpt:
      "B22. Percent of all degree-seeking, first-time, first-year students who enrolled in Fall 2023 and returned in Fall 2024: 93.2%",
    verification_checks: makeChecks(
      { passed: true, detail: "Retention metric correctly mapped from CDS Section B, question B22" },
      { passed: true, detail: "Value 93.2% directly quoted in CDS table row" },
      { passed: true, detail: "CDS Section B is the authoritative source for retention data" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.98,
    verified_at: "2024-09-10T14:25:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-003: Total Enrollment for UC Berkeley
  {
    id: "gv-003",
    observation_id: "obs-enrl-003",
    metric_id: "met-enrl-001",
    metric_name: "Total Enrollment",
    entity_id: "inst-004",
    entity_name: "University of California, Berkeley",
    extracted_value: 45307,
    unit: "headcount",
    fiscal_year: 2024,
    source_document_id: "doc-003",
    source_document_name: "IPEDS Enrollment Data",
    source_page: 3,
    source_text_excerpt:
      "Grand total, all students: 45,307 (Fall 2024 headcount)",
    verification_checks: makeChecks(
      { passed: true, detail: "Total enrollment headcount correctly identified from IPEDS summary row" },
      { passed: true, detail: "Extracted value 45,307 matches source exactly" },
      { passed: true, detail: "IPEDS enrollment summary table is the standard federal reporting source" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.96,
    verified_at: "2024-09-11T08:10:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-004: 6-Year Graduation Rate for U of Michigan
  {
    id: "gv-004",
    observation_id: "obs-grad-004",
    metric_id: "met-acad-005",
    metric_name: "Six-Year Graduation Rate",
    entity_id: "inst-003",
    entity_name: "University of Michigan",
    extracted_value: 93.8,
    unit: "%",
    fiscal_year: 2024,
    source_document_id: "doc-004",
    source_document_name: "CDS U of Michigan 2024",
    source_page: 9,
    source_text_excerpt:
      "B11. Six-year graduation rate for 2018 cohort: 93.8%. This represents students who entered as first-time, full-time degree-seeking freshmen.",
    verification_checks: makeChecks(
      { passed: true, detail: "Six-year graduation rate correctly identified from CDS Section B" },
      { passed: true, detail: "Value 93.8% matches CDS entry verbatim" },
      { passed: true, detail: "CDS B11 is the standard graduation rate disclosure line" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.95,
    verified_at: "2024-09-11T08:18:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-005: Total Endowment for Ohio State
  {
    id: "gv-005",
    observation_id: "obs-endow-005",
    metric_id: "met-fin-010",
    metric_name: "Total Endowment Market Value",
    entity_id: "inst-005",
    entity_name: "Ohio State University",
    extracted_value: 7260000000,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-005",
    source_document_name: "Annual Endowment Report FY2024",
    source_page: 4,
    source_text_excerpt:
      "As of June 30, 2024, the total endowment market value stood at $7,260,000,000, an increase of 12.1% from the prior fiscal year.",
    verification_checks: makeChecks(
      { passed: true, detail: "Endowment market value metric correctly identified from endowment report summary" },
      { passed: true, detail: "Extracted value $7,260,000,000 matches source text" },
      { passed: true, detail: "Source is the official annual endowment report prepared by the investment office" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.94,
    verified_at: "2024-09-12T10:05:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-006: Instructional Expenditures per FTE for SUNY Buffalo
  {
    id: "gv-006",
    observation_id: "obs-instr-006",
    metric_id: "met-fin-015",
    metric_name: "Instructional Expenditures per FTE",
    entity_id: "inst-001",
    entity_name: "State University of New York at Buffalo",
    extracted_value: 14823,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-001",
    source_document_name: "Annual Financial Report FY2024",
    source_page: 28,
    source_text_excerpt:
      "Instructional expenditures per FTE student totaled $14,823 for FY2024, compared to $14,102 in the prior year.",
    verification_checks: makeChecks(
      { passed: true, detail: "Instructional expenditure per FTE correctly identified from expenditure analysis section" },
      { passed: true, detail: "Value $14,823 matches the reported figure exactly" },
      { passed: true, detail: "Text is from the expenditure breakdown section of the audited financial report" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.92,
    verified_at: "2024-09-12T10:15:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-007: Acceptance Rate for UT Austin
  {
    id: "gv-007",
    observation_id: "obs-admit-007",
    metric_id: "met-acad-010",
    metric_name: "Acceptance Rate",
    entity_id: "inst-002",
    entity_name: "University of Texas at Austin",
    extracted_value: 31.8,
    unit: "%",
    fiscal_year: 2024,
    source_document_id: "doc-002",
    source_document_name: "CDS UT Austin 2024",
    source_page: 5,
    source_text_excerpt:
      "C1. Total first-time, first-year men and women applicants: 65,231. Total admitted: 20,743. Admission rate: 31.8%.",
    verification_checks: makeChecks(
      { passed: true, detail: "Acceptance rate correctly derived from CDS Section C admissions data" },
      { passed: true, detail: "31.8% matches calculated ratio (20,743 / 65,231) and reported rate" },
      { passed: true, detail: "CDS Section C is the authoritative admissions data disclosure" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.96,
    verified_at: "2024-09-12T11:00:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-010: Net Tuition Revenue for UC Berkeley
  {
    id: "gv-010",
    observation_id: "obs-tuit-010",
    metric_id: "met-fin-003",
    metric_name: "Net Tuition Revenue",
    entity_id: "inst-004",
    entity_name: "University of California, Berkeley",
    extracted_value: 895000000,
    unit: "USD",
    fiscal_year: 2023,
    source_document_id: "doc-006",
    source_document_name: "UC Berkeley Financial Statements FY2023",
    source_page: 15,
    source_text_excerpt:
      "Net student tuition and fees revenue, after scholarship allowances, was $895,000,000 for the year ended June 30, 2023.",
    verification_checks: makeChecks(
      { passed: true, detail: "Net tuition revenue correctly identified from GAAP financial statement line item" },
      { passed: true, detail: "Extracted value $895,000,000 matches the audited figure" },
      { passed: true, detail: "Located in the Statement of Revenues section of audited financials" },
    ),
    overall_verdict: "verified",
    confidence_score: 0.85,
    verified_at: "2024-09-13T09:30:00Z",
    verified_by: "grounding-engine-v2",
  },

  // =====================================================================
  // UNCERTAIN (3 records, 1-2 checks fail, confidence 0.50 - 0.70)
  // =====================================================================

  // gv-008: Research Expenditures for Ohio State
  {
    id: "gv-008",
    observation_id: "obs-res-008",
    metric_id: "met-res-001",
    metric_name: "Research Expenditures",
    entity_id: "inst-005",
    entity_name: "Ohio State University",
    extracted_value: 1450000000,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-007",
    source_document_name: "IPEDS Ohio State",
    source_page: 6,
    source_text_excerpt:
      "Total R&D expenditures reported to HERD: $1,234,567,000. Including medical center partnerships, the figure reaches approximately $1.45 billion.",
    verification_checks: makeChecks(
      { passed: true, detail: "Research expenditures metric correctly identified from HERD/IPEDS context" },
      { passed: false, detail: "Extracted value includes medical center partnerships which may not be standard HERD reporting" },
      { passed: true, detail: "Source text from federal reporting data section is contextually appropriate" },
    ),
    overall_verdict: "uncertain",
    confidence_score: 0.62,
    verified_at: "2024-09-13T10:00:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-009: Student-Faculty Ratio for SUNY Buffalo
  {
    id: "gv-009",
    observation_id: "obs-sfr-009",
    metric_id: "met-acad-020",
    metric_name: "Student-Faculty Ratio",
    entity_id: "inst-001",
    entity_name: "State University of New York at Buffalo",
    extracted_value: 13,
    unit: "ratio",
    fiscal_year: 2024,
    source_document_id: "doc-008",
    source_document_name: "Board Presentation Q4",
    source_page: 7,
    source_text_excerpt:
      "Our student-to-faculty ratio improved to 13:1 this year, though this includes part-time adjunct faculty in the denominator.",
    verification_checks: makeChecks(
      { passed: true, detail: "Student-faculty ratio metric correctly identified" },
      { passed: true, detail: "Value 13:1 directly stated in presentation slide" },
      { passed: false, detail: "Ratio calculation includes part-time adjuncts which differs from IPEDS methodology" },
    ),
    overall_verdict: "uncertain",
    confidence_score: 0.58,
    verified_at: "2024-09-13T10:20:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-011: Average Faculty Salary for U of Michigan
  {
    id: "gv-011",
    observation_id: "obs-sal-011",
    metric_id: "met-hr-002",
    metric_name: "Average Faculty Salary",
    entity_id: "inst-003",
    entity_name: "University of Michigan",
    extracted_value: 142500,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-009",
    source_document_name: "AAUP Faculty Compensation Survey 2024",
    source_page: 22,
    source_text_excerpt:
      "Average full professor salary: $168,200. Average associate professor salary: $125,300. Average assistant professor salary: $112,400. Weighted average across all ranks: approximately $142,500.",
    verification_checks: makeChecks(
      { passed: true, detail: "Average faculty salary metric correctly identified from AAUP data" },
      { passed: false, detail: "Extracted value is an approximate weighted average, not an exact reported figure; rounding methodology unclear" },
      { passed: true, detail: "AAUP compensation survey is the standard source for faculty salary benchmarking" },
    ),
    overall_verdict: "uncertain",
    confidence_score: 0.55,
    verified_at: "2024-09-14T08:45:00Z",
    verified_by: "grounding-engine-v2",
  },

  // =====================================================================
  // HALLUCINATION (2 records, 2-3 checks fail, confidence 0.15 - 0.35)
  // =====================================================================

  // gv-012: Deferred Maintenance for UT Austin (hallucinated)
  {
    id: "gv-012",
    observation_id: "obs-maint-012",
    metric_id: "met-fac-005",
    metric_name: "Deferred Maintenance Backlog",
    entity_id: "inst-002",
    entity_name: "University of Texas at Austin",
    extracted_value: 2300000000,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-010",
    source_document_name: "Facilities Assessment Report",
    source_page: 34,
    source_text_excerpt:
      "The total facilities portfolio is valued at $2.3 billion. A comprehensive deferred maintenance study is planned for FY2025.",
    verification_checks: makeChecks(
      { passed: false, detail: "AI confused total facilities value with deferred maintenance backlog" },
      { passed: false, detail: "$2.3B refers to total portfolio value, not maintenance backlog" },
      { passed: false, detail: "Source text discusses facilities value, not maintenance needs" },
    ),
    overall_verdict: "hallucination",
    confidence_score: 0.18,
    verified_at: "2024-09-14T09:30:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-013: Auxiliary Services Margin for UC Berkeley (hallucinated)
  {
    id: "gv-013",
    observation_id: "obs-aux-013",
    metric_id: "met-fin-025",
    metric_name: "Auxiliary Services Operating Margin",
    entity_id: "inst-004",
    entity_name: "University of California, Berkeley",
    extracted_value: 18.5,
    unit: "%",
    fiscal_year: 2024,
    source_document_id: "doc-011",
    source_document_name: "Research Expenditure Summary",
    source_page: 11,
    source_text_excerpt:
      "Indirect cost recovery rate for federal grants is set at 18.5% for FY2024.",
    verification_checks: makeChecks(
      { passed: false, detail: "AI extracted indirect cost rate as auxiliary margin" },
      { passed: false, detail: "18.5% is the indirect cost rate, not auxiliary margin" },
      { passed: false, detail: "Source discusses research grants, not auxiliary services" },
    ),
    overall_verdict: "hallucination",
    confidence_score: 0.12,
    verified_at: "2024-09-14T09:45:00Z",
    verified_by: "grounding-engine-v2",
  },

  // =====================================================================
  // NEEDS_REVIEW (2 records, mixed results, confidence 0.60 - 0.75)
  // =====================================================================

  // gv-014: Total Degrees Awarded for Ohio State (needs review -- value plausible but source ambiguous)
  {
    id: "gv-014",
    observation_id: "obs-deg-014",
    metric_id: "met-acad-030",
    metric_name: "Total Degrees Awarded",
    entity_id: "inst-005",
    entity_name: "Ohio State University",
    extracted_value: 16842,
    unit: "count",
    fiscal_year: 2023,
    source_document_id: "doc-012",
    source_document_name: "OSU Institutional Profile 2023",
    source_page: 19,
    source_text_excerpt:
      "In the 2022-23 academic year, Ohio State awarded 16,842 degrees. Note: this figure includes Columbus campus only; regional campuses awarded an additional 1,203 degrees.",
    verification_checks: makeChecks(
      { passed: true, detail: "Total degrees awarded metric correctly identified" },
      { passed: true, detail: "Value 16,842 matches source text for Columbus campus" },
      { passed: false, detail: "Ambiguous whether 'total degrees' should include regional campuses; IPEDS typically reports all campuses combined" },
    ),
    overall_verdict: "needs_review",
    confidence_score: 0.68,
    verified_at: "2024-09-15T11:10:00Z",
    verified_by: "grounding-engine-v2",
  },

  // gv-015: State Appropriations for U of Michigan (needs review -- year mismatch possible)
  {
    id: "gv-015",
    observation_id: "obs-approp-015",
    metric_id: "met-fin-008",
    metric_name: "State Appropriations",
    entity_id: "inst-003",
    entity_name: "University of Michigan",
    extracted_value: 398000000,
    unit: "USD",
    fiscal_year: 2024,
    source_document_id: "doc-013",
    source_document_name: "Michigan State Budget Allocation Report",
    source_page: 41,
    source_text_excerpt:
      "The University of Michigan Ann Arbor campus is allocated $398,000,000 in state operating appropriations for the fiscal year beginning October 1, 2023.",
    verification_checks: makeChecks(
      { passed: true, detail: "State appropriations metric correctly identified from budget allocation report" },
      { passed: false, detail: "Fiscal year alignment is ambiguous: state fiscal year (Oct 2023 - Sep 2024) vs university fiscal year (Jul 2023 - Jun 2024) may not align" },
      { passed: true, detail: "State budget allocation report is an authoritative source for appropriations data" },
    ),
    overall_verdict: "needs_review",
    confidence_score: 0.72,
    verified_at: "2024-09-15T11:30:00Z",
    verified_by: "grounding-engine-v2",
  },
];

// ===== HELPER FUNCTIONS =====

/**
 * Filter verifications by verdict type.
 * @param verdict - One of "verified" | "uncertain" | "hallucination" | "needs_review"
 */
export function getVerificationsByVerdict(verdict: string): GroundingVerification[] {
  return groundingVerifications.filter((v) => v.overall_verdict === verdict);
}

/**
 * Filter verifications by entity (institution) ID.
 * @param entityId - e.g. "inst-001"
 */
export function getVerificationsByEntity(entityId: string): GroundingVerification[] {
  return groundingVerifications.filter((v) => v.entity_id === entityId);
}

/**
 * Returns all verifications that require attention:
 * uncertain + hallucination + needs_review (i.e. everything except "verified").
 */
export function getSuspiciousVerifications(): GroundingVerification[] {
  return groundingVerifications.filter(
    (v) =>
      v.overall_verdict === "uncertain" ||
      v.overall_verdict === "hallucination" ||
      v.overall_verdict === "needs_review",
  );
}
