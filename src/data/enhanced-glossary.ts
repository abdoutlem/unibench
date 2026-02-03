import type {
  EnhancedMetricDefinition,
  MetricAlias,
  Dimension,
} from "@/types/platform";

// =============================================================================
// ENHANCED METRIC DEFINITIONS
// 20 metrics across domains: finance, enrollment/students, faculty, research,
// facilities, and operations. Each definition is aligned with the canonical
// data model and realistic for US higher education analytics.
// =============================================================================

export const enhancedMetricDefinitions: EnhancedMetricDefinition[] = [
  // ---------------------------------------------------------------------------
  // DOMAIN: FINANCE (5 metrics)
  // ---------------------------------------------------------------------------
  {
    metric_id: "M_REVENUE_TOTAL",
    canonical_name: "total_operating_revenue",
    display_name: "Total Operating Revenue",
    description:
      "Total revenue from all operating sources including tuition, grants, auxiliary enterprises, and other operating activities for the fiscal year.",
    domain: "finance",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "sum",
    calculation_logic:
      "Sum of net tuition revenue + government appropriations + grants and contracts + auxiliary enterprise revenue + other operating revenue.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "fund_type",
        allowed_values: ["restricted", "unrestricted"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Budget and Finance",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "total revenue",
      "operating revenue",
      "gross operating revenue",
      "institutional revenue",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Total operating revenue must be non-negative.",
        severity: "error",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 30 },
        error_message:
          "Year-over-year change exceeds 30%, which may indicate a data entry error.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_TUITION_NET",
    canonical_name: "net_tuition_revenue",
    display_name: "Net Tuition Revenue",
    description:
      "Tuition and fee revenue net of institutional scholarships and financial aid discounts.",
    domain: "finance",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "sum",
    calculation_logic:
      "Gross tuition and fees charged minus institutional scholarships, grants-in-aid, tuition waivers, and other tuition discounts.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "student_level",
        allowed_values: ["undergraduate", "graduate", "professional"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Budget and Finance",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "net tuition and fees",
      "tuition revenue after discounts",
      "net student revenue",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Net tuition revenue must be non-negative.",
        severity: "error",
      },
      {
        type: "cross_metric",
        params: { related_metric: "M_REVENUE_TOTAL", operator: "lte" },
        error_message:
          "Net tuition revenue should not exceed total operating revenue.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_ENDOWMENT_VALUE",
    canonical_name: "endowment_market_value",
    display_name: "Endowment Market Value",
    description:
      "Total market value of the institution's endowment fund at fiscal year-end, including both donor-restricted and board-designated quasi-endowment funds.",
    domain: "finance",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "latest",
    calculation_logic:
      "Fair market value of all endowment assets as reported at fiscal year-end per NACUBO guidelines.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "fund_type",
        allowed_values: ["restricted", "unrestricted"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of the Treasurer",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "endowment value",
      "endowment fund market value",
      "total endowment",
      "endowment assets",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Endowment market value must be non-negative.",
        severity: "error",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 40 },
        error_message:
          "Year-over-year change exceeds 40%, which is unusual for endowment values.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_DEBT_SERVICE_RATIO",
    canonical_name: "debt_service_coverage_ratio",
    display_name: "Debt Service Coverage Ratio",
    description:
      "Ratio of net operating income available for debt service to annual debt service obligations, a key indicator of financial health and creditworthiness.",
    domain: "finance",
    unit: "x",
    value_type: "ratio",
    default_aggregation: "latest",
    calculation_logic:
      "(Net operating income + depreciation + interest expense) / (principal payments + interest payments).",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Budget and Finance",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "DSCR",
      "debt coverage ratio",
      "debt service ratio",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Debt service coverage ratio must be non-negative.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 0.5, max: 10 },
        error_message:
          "Debt service coverage ratio outside expected range of 0.5x to 10x.",
        severity: "warning",
      },
    ],
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_ADMIN_EXPENSE_RATIO",
    canonical_name: "administrative_expense_ratio",
    display_name: "Administrative Expense Ratio",
    description:
      "Institutional support and administrative expenses as a percentage of total operating expenses. A measure of operational efficiency.",
    domain: "finance",
    unit: "%",
    value_type: "percentage",
    default_aggregation: "average",
    calculation_logic:
      "(Institutional support expenses / total operating expenses) * 100.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Budget and Finance",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "admin expense ratio",
      "administrative overhead ratio",
      "institutional support percentage",
    ],
    validation_rules: [
      {
        type: "percentage_bound",
        params: { min: 0, max: 100 },
        error_message:
          "Administrative expense ratio must be between 0% and 100%.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 3, max: 40 },
        error_message:
          "Administrative expense ratio outside typical range of 3% to 40%.",
        severity: "warning",
      },
    ],
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: ENROLLMENT / STUDENTS (5 metrics)
  // ---------------------------------------------------------------------------
  {
    metric_id: "M_ENROLLMENT_TOTAL",
    canonical_name: "total_enrollment",
    display_name: "Total Enrollment",
    description:
      "Total headcount enrollment across all levels and enrollment statuses as of the fall census date.",
    domain: "enrollment",
    unit: "students",
    value_type: "count",
    default_aggregation: "sum",
    calculation_logic:
      "Unduplicated headcount of all students enrolled as of the official fall census date, including undergraduate, graduate, and professional students.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "student_level",
        allowed_values: ["undergraduate", "graduate"],
        is_required: false,
      },
      {
        dimension_name: "enrollment_status",
        allowed_values: ["full_time", "part_time"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "total headcount enrollment",
      "fall enrollment",
      "total students enrolled",
      "headcount",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Total enrollment must be non-negative.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 100, max: 100000 },
        error_message:
          "Total enrollment outside expected range of 100 to 100,000 for a single institution.",
        severity: "warning",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 15 },
        error_message:
          "Year-over-year enrollment change exceeds 15%, which may indicate a data issue.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_ENROLLMENT_UG",
    canonical_name: "undergraduate_enrollment",
    display_name: "Undergraduate Enrollment",
    description:
      "Headcount of undergraduate students enrolled as of the fall census date.",
    domain: "enrollment",
    unit: "students",
    value_type: "count",
    default_aggregation: "sum",
    calculation_logic:
      "Unduplicated headcount of students classified as undergraduate (including first-time, transfer, and continuing) as of the fall census date.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "enrollment_status",
        allowed_values: ["full_time", "part_time"],
        is_required: false,
      },
      {
        dimension_name: "gender",
        allowed_values: ["male", "female", "other", "unknown"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "UG enrollment",
      "undergraduate headcount",
      "undergrad students",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Undergraduate enrollment must be non-negative.",
        severity: "error",
      },
      {
        type: "cross_metric",
        params: { related_metric: "M_ENROLLMENT_TOTAL", operator: "lte" },
        error_message:
          "Undergraduate enrollment should not exceed total enrollment.",
        severity: "error",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_ENROLLMENT_GRAD",
    canonical_name: "graduate_enrollment",
    display_name: "Graduate Enrollment",
    description:
      "Headcount of graduate and professional students enrolled as of the fall census date.",
    domain: "enrollment",
    unit: "students",
    value_type: "count",
    default_aggregation: "sum",
    calculation_logic:
      "Unduplicated headcount of students classified as graduate or professional as of the fall census date.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "enrollment_status",
        allowed_values: ["full_time", "part_time"],
        is_required: false,
      },
      {
        dimension_name: "gender",
        allowed_values: ["male", "female", "other", "unknown"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "grad enrollment",
      "graduate headcount",
      "graduate and professional enrollment",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Graduate enrollment must be non-negative.",
        severity: "error",
      },
      {
        type: "cross_metric",
        params: { related_metric: "M_ENROLLMENT_TOTAL", operator: "lte" },
        error_message:
          "Graduate enrollment should not exceed total enrollment.",
        severity: "error",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_RETENTION_FIRST_YEAR",
    canonical_name: "first_year_retention_rate",
    display_name: "First-Year Retention Rate",
    description:
      "Percentage of first-time, full-time degree-seeking freshmen who return for their second year at the same institution.",
    domain: "enrollment",
    unit: "%",
    value_type: "percentage",
    default_aggregation: "average",
    calculation_logic:
      "(Number of first-time full-time freshmen returning for year 2 / number in the original entering cohort) * 100.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "gender",
        allowed_values: ["male", "female", "other", "unknown"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "freshman retention rate",
      "first-to-second year retention",
      "retention rate",
      "FTFT retention",
    ],
    validation_rules: [
      {
        type: "percentage_bound",
        params: { min: 0, max: 100 },
        error_message: "Retention rate must be between 0% and 100%.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 30, max: 100 },
        error_message:
          "Retention rate below 30% is unusually low and may indicate a data issue.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_GRAD_RATE_6YR",
    canonical_name: "six_year_graduation_rate",
    display_name: "Six-Year Graduation Rate",
    description:
      "Percentage of first-time, full-time degree-seeking undergraduates who complete a bachelor's degree within 150% of normal time (6 years).",
    domain: "enrollment",
    unit: "%",
    value_type: "percentage",
    default_aggregation: "average",
    calculation_logic:
      "(Number of students in the cohort completing a bachelor's degree within 6 years / number in the original entering cohort) * 100. Follows IPEDS methodology.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "gender",
        allowed_values: ["male", "female", "other", "unknown"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "6-year grad rate",
      "150% graduation rate",
      "bachelor's completion rate",
    ],
    validation_rules: [
      {
        type: "percentage_bound",
        params: { min: 0, max: 100 },
        error_message: "Graduation rate must be between 0% and 100%.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 10, max: 100 },
        error_message:
          "Six-year graduation rate below 10% is unusual and may indicate a data issue.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: FACULTY (2 metrics)
  // ---------------------------------------------------------------------------
  {
    metric_id: "M_FACULTY_TOTAL",
    canonical_name: "total_faculty_headcount",
    display_name: "Total Faculty Headcount",
    description:
      "Total number of instructional faculty across all ranks and employment types, counted as of the fall reporting period.",
    domain: "faculty",
    unit: "faculty",
    value_type: "count",
    default_aggregation: "sum",
    calculation_logic:
      "Unduplicated headcount of all instructional faculty (full-time and part-time) as reported to IPEDS in the fall staff survey.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "gender",
        allowed_values: ["male", "female", "other", "unknown"],
        is_required: false,
      },
      {
        dimension_name: "contract_type",
        allowed_values: ["full_time", "part_time"],
        is_required: false,
      },
      {
        dimension_name: "rank",
        allowed_values: [
          "professor",
          "associate_professor",
          "assistant_professor",
          "instructor",
          "lecturer",
        ],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of the Provost",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "faculty count",
      "instructional staff headcount",
      "total instructional faculty",
      "number of faculty",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Faculty headcount must be non-negative.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 10, max: 15000 },
        error_message:
          "Faculty headcount outside expected range of 10 to 15,000 for a single institution.",
        severity: "warning",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 20 },
        error_message:
          "Year-over-year faculty change exceeds 20%, which may indicate a data issue.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_STU_FACULTY_RATIO",
    canonical_name: "student_to_faculty_ratio",
    display_name: "Student-to-Faculty Ratio",
    description:
      "The ratio of full-time equivalent students to full-time equivalent instructional faculty. A key indicator used in institutional rankings and accreditation.",
    domain: "faculty",
    unit: ":1",
    value_type: "ratio",
    default_aggregation: "average",
    calculation_logic:
      "Total FTE students / total FTE instructional faculty. FTE is calculated per IPEDS convention (full-time + 1/3 part-time).",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "student-faculty ratio",
      "students per faculty",
      "SFR",
      "class size proxy",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Student-to-faculty ratio must be non-negative.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 1, max: 50 },
        error_message:
          "Student-to-faculty ratio outside expected range of 1:1 to 50:1.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: RESEARCH (2 metrics)
  // ---------------------------------------------------------------------------
  {
    metric_id: "M_RESEARCH_EXPENDITURES",
    canonical_name: "research_expenditures",
    display_name: "Research Expenditures",
    description:
      "Total research and development expenditures reported to NSF HERD survey, including federally funded and institutionally funded research.",
    domain: "research",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "sum",
    calculation_logic:
      "Sum of all R&D expenditures as reported on the NSF Higher Education Research and Development (HERD) Survey, including federal, state, institutional, and other sources.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "fund_type",
        allowed_values: ["restricted", "unrestricted"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "R&D expenditures",
      "research spending",
      "total research expenditures",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Research expenditures must be non-negative.",
        severity: "error",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 35 },
        error_message:
          "Year-over-year change exceeds 35%, which may warrant review.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_SPONSORED_AWARDS",
    canonical_name: "sponsored_research_awards",
    display_name: "Sponsored Research Awards",
    description:
      "Total value of new sponsored research awards received during the fiscal year from federal, state, foundation, and industry sponsors.",
    domain: "research",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "sum",
    calculation_logic:
      "Sum of all new sponsored research award amounts received during the fiscal year, including grants, contracts, and cooperative agreements.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "fund_type",
        allowed_values: ["restricted", "unrestricted"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Research",
    status: "draft",
    version: "1.0.0",
    semantic_variations: [
      "research awards",
      "sponsored awards",
      "grants awarded",
      "new research funding",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Sponsored research awards must be non-negative.",
        severity: "error",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 50 },
        error_message:
          "Year-over-year change exceeds 50%, which is unusual for award volumes.",
        severity: "warning",
      },
    ],
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: FACILITIES (2 metrics)
  // ---------------------------------------------------------------------------
  {
    metric_id: "M_DEFERRED_MAINT",
    canonical_name: "deferred_maintenance_backlog",
    display_name: "Deferred Maintenance Backlog",
    description:
      "Estimated total dollar value of deferred maintenance and capital renewal needs across the institution's facilities portfolio.",
    domain: "facilities",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "sum",
    calculation_logic:
      "Sum of all identified but unfunded maintenance, repair, and capital renewal projects as assessed in the most recent facilities condition audit.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
    ],
    expected_frequency: "annual",
    owner: "Facilities Management",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "deferred maintenance",
      "capital renewal backlog",
      "maintenance backlog",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Deferred maintenance backlog must be non-negative.",
        severity: "error",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 40 },
        error_message:
          "Year-over-year change in deferred maintenance exceeds 40%.",
        severity: "warning",
      },
    ],
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_FACILITIES_SQFT",
    canonical_name: "facilities_square_footage",
    display_name: "Facilities Square Footage",
    description:
      "Total gross square footage of all institutional buildings and facilities, including education and general, auxiliary, and hospital space.",
    domain: "facilities",
    unit: "sqft",
    value_type: "count",
    default_aggregation: "sum",
    calculation_logic:
      "Sum of gross square footage across all owned and leased institutional buildings as reported in the facilities inventory.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
    ],
    expected_frequency: "annual",
    owner: "Facilities Management",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "total square footage",
      "building area",
      "campus square footage",
      "GSF",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Facilities square footage must be non-negative.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 50000, max: 50000000 },
        error_message:
          "Square footage outside expected range of 50K to 50M sqft for a single institution.",
        severity: "warning",
      },
    ],
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: OPERATIONS (4 metrics)
  // ---------------------------------------------------------------------------
  {
    metric_id: "M_GRAD_RATE_4YR",
    canonical_name: "four_year_graduation_rate",
    display_name: "Four-Year Graduation Rate",
    description:
      "Percentage of first-time, full-time degree-seeking undergraduates who complete a bachelor's degree within 100% of normal time (4 years).",
    domain: "operations",
    unit: "%",
    value_type: "percentage",
    default_aggregation: "average",
    calculation_logic:
      "(Number of students in the cohort completing a bachelor's degree within 4 years / number in the original entering cohort) * 100.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "gender",
        allowed_values: ["male", "female", "other", "unknown"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Institutional Research",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "4-year grad rate",
      "100% graduation rate",
      "on-time graduation rate",
    ],
    validation_rules: [
      {
        type: "percentage_bound",
        params: { min: 0, max: 100 },
        error_message: "Graduation rate must be between 0% and 100%.",
        severity: "error",
      },
      {
        type: "cross_metric",
        params: { related_metric: "M_GRAD_RATE_6YR", operator: "lte" },
        error_message:
          "Four-year graduation rate should not exceed six-year graduation rate.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_DEGREES_AWARDED",
    canonical_name: "total_degrees_awarded",
    display_name: "Total Degrees Awarded",
    description:
      "Total number of degrees and certificates conferred during the academic year across all levels and disciplines.",
    domain: "operations",
    unit: "degrees",
    value_type: "count",
    default_aggregation: "sum",
    calculation_logic:
      "Count of all degrees and certificates conferred during the July 1 to June 30 academic year as reported to IPEDS Completions.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "degree_level",
        allowed_values: ["bachelor", "master", "doctorate"],
        is_required: false,
      },
      {
        dimension_name: "discipline",
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of the Registrar",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "degrees conferred",
      "completions",
      "total completions",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Total degrees awarded must be non-negative.",
        severity: "error",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 20 },
        error_message:
          "Year-over-year change in degrees awarded exceeds 20%.",
        severity: "warning",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_AUX_MARGIN",
    canonical_name: "auxiliary_services_margin",
    display_name: "Auxiliary Services Margin",
    description:
      "Net operating margin for auxiliary enterprises (housing, dining, athletics, parking, bookstore) as a percentage of auxiliary revenue.",
    domain: "operations",
    unit: "%",
    value_type: "percentage",
    default_aggregation: "average",
    calculation_logic:
      "((Auxiliary enterprise revenue - auxiliary enterprise expenses) / auxiliary enterprise revenue) * 100.",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Business Services",
    status: "active",
    version: "1.0.0",
    semantic_variations: [
      "auxiliary margin",
      "aux services margin",
      "auxiliary operating margin",
    ],
    validation_rules: [
      {
        type: "range",
        params: { min: -50, max: 50 },
        error_message:
          "Auxiliary services margin outside expected range of -50% to 50%.",
        severity: "warning",
      },
      {
        type: "percentage_bound",
        params: { min: -100, max: 100 },
        error_message:
          "Auxiliary services margin must be between -100% and 100%.",
        severity: "error",
      },
    ],
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
  {
    metric_id: "M_COST_PER_FTE",
    canonical_name: "cost_per_student_fte",
    display_name: "Cost per Student FTE",
    description:
      "Total educational and general expenditures divided by total student FTE. A key efficiency and benchmarking metric.",
    domain: "operations",
    unit: "USD",
    value_type: "currency",
    default_aggregation: "average",
    calculation_logic:
      "Total education and general (E&G) expenditures / total student FTE. FTE calculated as full-time headcount + (1/3 * part-time headcount).",
    valid_dimensions: [
      {
        dimension_name: "fiscal_year",
        is_required: true,
      },
      {
        dimension_name: "student_level",
        allowed_values: ["undergraduate", "graduate", "professional"],
        is_required: false,
      },
    ],
    expected_frequency: "annual",
    owner: "Office of Budget and Finance",
    status: "draft",
    version: "1.0.0",
    semantic_variations: [
      "E&G cost per FTE",
      "expenditure per student",
      "cost per student",
    ],
    validation_rules: [
      {
        type: "non_negative",
        params: {},
        error_message: "Cost per student FTE must be non-negative.",
        severity: "error",
      },
      {
        type: "range",
        params: { min: 5000, max: 200000 },
        error_message:
          "Cost per student FTE outside expected range of $5,000 to $200,000.",
        severity: "warning",
      },
      {
        type: "year_over_year_change",
        params: { max_change_pct: 25 },
        error_message:
          "Year-over-year change in cost per FTE exceeds 25%.",
        severity: "warning",
      },
    ],
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-09-01T14:30:00Z",
  },
];

// =============================================================================
// METRIC ALIASES
// Maps source-specific names to canonical metrics. Approximately 2-3 aliases
// per metric (~50 total) across IPEDS, CDS, internal, US News, and NACUBO.
// =============================================================================

export const metricAliases: MetricAlias[] = [
  // --- M_REVENUE_TOTAL aliases ---
  {
    id: "MA_001",
    metric_id: "M_REVENUE_TOTAL",
    alias: "Total revenues and other additions",
    source_system: "ipeds",
    confidence: 0.95,
    is_primary: true,
  },
  {
    id: "MA_002",
    metric_id: "M_REVENUE_TOTAL",
    alias: "Total Operating Revenue",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },
  {
    id: "MA_003",
    metric_id: "M_REVENUE_TOTAL",
    alias: "Core revenues",
    source_system: "ipeds",
    confidence: 0.8,
    is_primary: false,
  },

  // --- M_TUITION_NET aliases ---
  {
    id: "MA_004",
    metric_id: "M_TUITION_NET",
    alias: "Tuition and fees, after deducting discounts and allowances",
    source_system: "ipeds",
    confidence: 0.97,
    is_primary: true,
  },
  {
    id: "MA_005",
    metric_id: "M_TUITION_NET",
    alias: "Net tuition and fees",
    source_system: "cds",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_006",
    metric_id: "M_TUITION_NET",
    alias: "Net Student Tuition Revenue",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },

  // --- M_ENDOWMENT_VALUE aliases ---
  {
    id: "MA_007",
    metric_id: "M_ENDOWMENT_VALUE",
    alias: "Endowment assets (market value) per FTE enrollment",
    source_system: "ipeds",
    confidence: 0.7,
    is_primary: false,
  },
  {
    id: "MA_008",
    metric_id: "M_ENDOWMENT_VALUE",
    alias: "Total Endowment Market Value",
    source_system: "nacubo",
    confidence: 0.98,
    is_primary: true,
  },
  {
    id: "MA_009",
    metric_id: "M_ENDOWMENT_VALUE",
    alias: "Endowment Size",
    source_system: "usnews",
    confidence: 0.85,
    is_primary: false,
  },

  // --- M_DEBT_SERVICE_RATIO aliases ---
  {
    id: "MA_010",
    metric_id: "M_DEBT_SERVICE_RATIO",
    alias: "DSCR",
    source_system: "internal",
    confidence: 1.0,
    is_primary: true,
  },
  {
    id: "MA_011",
    metric_id: "M_DEBT_SERVICE_RATIO",
    alias: "Debt Service Coverage",
    source_system: "internal",
    confidence: 0.95,
    is_primary: false,
  },

  // --- M_ADMIN_EXPENSE_RATIO aliases ---
  {
    id: "MA_012",
    metric_id: "M_ADMIN_EXPENSE_RATIO",
    alias: "Institutional support as percent of core expenses",
    source_system: "ipeds",
    confidence: 0.9,
    is_primary: true,
  },
  {
    id: "MA_013",
    metric_id: "M_ADMIN_EXPENSE_RATIO",
    alias: "Administrative Overhead %",
    source_system: "internal",
    confidence: 0.92,
    is_primary: false,
  },
  {
    id: "MA_014",
    metric_id: "M_ADMIN_EXPENSE_RATIO",
    alias: "Admin Expense Ratio",
    source_system: "cds",
    confidence: 0.88,
    is_primary: false,
  },

  // --- M_ENROLLMENT_TOTAL aliases ---
  {
    id: "MA_015",
    metric_id: "M_ENROLLMENT_TOTAL",
    alias: "Total fall enrollment",
    source_system: "ipeds",
    confidence: 0.98,
    is_primary: true,
  },
  {
    id: "MA_016",
    metric_id: "M_ENROLLMENT_TOTAL",
    alias: "Total Enrollment (CDS B1)",
    source_system: "cds",
    confidence: 0.97,
    is_primary: false,
  },
  {
    id: "MA_017",
    metric_id: "M_ENROLLMENT_TOTAL",
    alias: "Total Student Headcount",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },

  // --- M_ENROLLMENT_UG aliases ---
  {
    id: "MA_018",
    metric_id: "M_ENROLLMENT_UG",
    alias: "Undergraduate enrollment",
    source_system: "ipeds",
    confidence: 0.97,
    is_primary: true,
  },
  {
    id: "MA_019",
    metric_id: "M_ENROLLMENT_UG",
    alias: "Total Undergraduates (CDS B1)",
    source_system: "cds",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_020",
    metric_id: "M_ENROLLMENT_UG",
    alias: "UG Headcount",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },

  // --- M_ENROLLMENT_GRAD aliases ---
  {
    id: "MA_021",
    metric_id: "M_ENROLLMENT_GRAD",
    alias: "Graduate enrollment",
    source_system: "ipeds",
    confidence: 0.97,
    is_primary: true,
  },
  {
    id: "MA_022",
    metric_id: "M_ENROLLMENT_GRAD",
    alias: "Total Graduate Students (CDS B1)",
    source_system: "cds",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_023",
    metric_id: "M_ENROLLMENT_GRAD",
    alias: "Graduate & Professional Headcount",
    source_system: "internal",
    confidence: 0.98,
    is_primary: false,
  },

  // --- M_RETENTION_FIRST_YEAR aliases ---
  {
    id: "MA_024",
    metric_id: "M_RETENTION_FIRST_YEAR",
    alias: "Full-time retention rate",
    source_system: "ipeds",
    confidence: 0.96,
    is_primary: true,
  },
  {
    id: "MA_025",
    metric_id: "M_RETENTION_FIRST_YEAR",
    alias: "Freshman Retention Rate (CDS B22)",
    source_system: "cds",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_026",
    metric_id: "M_RETENTION_FIRST_YEAR",
    alias: "Freshmen retention rate",
    source_system: "usnews",
    confidence: 0.9,
    is_primary: false,
  },

  // --- M_GRAD_RATE_6YR aliases ---
  {
    id: "MA_027",
    metric_id: "M_GRAD_RATE_6YR",
    alias: "Graduation rate - Bachelor degree within 6 years, total",
    source_system: "ipeds",
    confidence: 0.98,
    is_primary: true,
  },
  {
    id: "MA_028",
    metric_id: "M_GRAD_RATE_6YR",
    alias: "Six-year graduation rate (CDS B11)",
    source_system: "cds",
    confidence: 0.97,
    is_primary: false,
  },
  {
    id: "MA_029",
    metric_id: "M_GRAD_RATE_6YR",
    alias: "6-Year Graduation Rate",
    source_system: "usnews",
    confidence: 0.92,
    is_primary: false,
  },

  // --- M_FACULTY_TOTAL aliases ---
  {
    id: "MA_030",
    metric_id: "M_FACULTY_TOTAL",
    alias: "Total number of instructional faculty",
    source_system: "ipeds",
    confidence: 0.96,
    is_primary: true,
  },
  {
    id: "MA_031",
    metric_id: "M_FACULTY_TOTAL",
    alias: "Instructional Faculty (CDS I1)",
    source_system: "cds",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_032",
    metric_id: "M_FACULTY_TOTAL",
    alias: "Faculty Headcount",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },

  // --- M_STU_FACULTY_RATIO aliases ---
  {
    id: "MA_033",
    metric_id: "M_STU_FACULTY_RATIO",
    alias: "Student-to-faculty ratio",
    source_system: "ipeds",
    confidence: 0.97,
    is_primary: true,
  },
  {
    id: "MA_034",
    metric_id: "M_STU_FACULTY_RATIO",
    alias: "Student/Faculty Ratio (CDS I2)",
    source_system: "cds",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_035",
    metric_id: "M_STU_FACULTY_RATIO",
    alias: "Student-faculty ratio",
    source_system: "usnews",
    confidence: 0.92,
    is_primary: false,
  },

  // --- M_RESEARCH_EXPENDITURES aliases ---
  {
    id: "MA_036",
    metric_id: "M_RESEARCH_EXPENDITURES",
    alias: "Research and development expenditures",
    source_system: "ipeds",
    confidence: 0.93,
    is_primary: false,
  },
  {
    id: "MA_037",
    metric_id: "M_RESEARCH_EXPENDITURES",
    alias: "Total R&D Expenditures",
    source_system: "internal",
    confidence: 1.0,
    is_primary: true,
  },
  {
    id: "MA_038",
    metric_id: "M_RESEARCH_EXPENDITURES",
    alias: "HERD Total R&D",
    source_system: "ipeds",
    confidence: 0.9,
    is_primary: false,
  },

  // --- M_SPONSORED_AWARDS aliases ---
  {
    id: "MA_039",
    metric_id: "M_SPONSORED_AWARDS",
    alias: "Sponsored Program Awards",
    source_system: "internal",
    confidence: 1.0,
    is_primary: true,
  },
  {
    id: "MA_040",
    metric_id: "M_SPONSORED_AWARDS",
    alias: "Total Grants & Contracts Awarded",
    source_system: "internal",
    confidence: 0.92,
    is_primary: false,
  },

  // --- M_DEFERRED_MAINT aliases ---
  {
    id: "MA_041",
    metric_id: "M_DEFERRED_MAINT",
    alias: "Deferred Maintenance Backlog",
    source_system: "internal",
    confidence: 1.0,
    is_primary: true,
  },
  {
    id: "MA_042",
    metric_id: "M_DEFERRED_MAINT",
    alias: "Capital Renewal Needs",
    source_system: "internal",
    confidence: 0.85,
    is_primary: false,
  },

  // --- M_FACILITIES_SQFT aliases ---
  {
    id: "MA_043",
    metric_id: "M_FACILITIES_SQFT",
    alias: "Total Gross Square Footage",
    source_system: "internal",
    confidence: 1.0,
    is_primary: true,
  },
  {
    id: "MA_044",
    metric_id: "M_FACILITIES_SQFT",
    alias: "Institutional GSF",
    source_system: "internal",
    confidence: 0.95,
    is_primary: false,
  },
  {
    id: "MA_045",
    metric_id: "M_FACILITIES_SQFT",
    alias: "Campus Building Area (sq ft)",
    source_system: "cds",
    confidence: 0.8,
    is_primary: false,
  },

  // --- M_GRAD_RATE_4YR aliases ---
  {
    id: "MA_046",
    metric_id: "M_GRAD_RATE_4YR",
    alias: "Graduation rate - Bachelor degree within 4 years, total",
    source_system: "ipeds",
    confidence: 0.98,
    is_primary: true,
  },
  {
    id: "MA_047",
    metric_id: "M_GRAD_RATE_4YR",
    alias: "Four-year graduation rate (CDS B7)",
    source_system: "cds",
    confidence: 0.97,
    is_primary: false,
  },

  // --- M_DEGREES_AWARDED aliases ---
  {
    id: "MA_048",
    metric_id: "M_DEGREES_AWARDED",
    alias: "Awards/degrees conferred",
    source_system: "ipeds",
    confidence: 0.96,
    is_primary: true,
  },
  {
    id: "MA_049",
    metric_id: "M_DEGREES_AWARDED",
    alias: "Degrees Conferred",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },

  // --- M_AUX_MARGIN aliases ---
  {
    id: "MA_050",
    metric_id: "M_AUX_MARGIN",
    alias: "Auxiliary Enterprise Operating Margin",
    source_system: "internal",
    confidence: 1.0,
    is_primary: true,
  },
  {
    id: "MA_051",
    metric_id: "M_AUX_MARGIN",
    alias: "Auxiliary Services Net Margin %",
    source_system: "internal",
    confidence: 0.95,
    is_primary: false,
  },

  // --- M_COST_PER_FTE aliases ---
  {
    id: "MA_052",
    metric_id: "M_COST_PER_FTE",
    alias: "Education and general expenditures per FTE",
    source_system: "ipeds",
    confidence: 0.9,
    is_primary: true,
  },
  {
    id: "MA_053",
    metric_id: "M_COST_PER_FTE",
    alias: "E&G Spending per Student FTE",
    source_system: "internal",
    confidence: 1.0,
    is_primary: false,
  },
  {
    id: "MA_054",
    metric_id: "M_COST_PER_FTE",
    alias: "Instructional expenditures per FTE",
    source_system: "usnews",
    confidence: 0.75,
    is_primary: false,
  },
];

// =============================================================================
// DIMENSIONS
// 10 canonical dimensions used to slice metric observations in the analytics
// platform. Each dimension has a type and optional restricted allowed values.
// =============================================================================

export const dimensions: Dimension[] = [
  {
    dimension_id: "DIM_FISCAL_YEAR",
    dimension_name: "fiscal_year",
    dimension_type: "numerical",
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_GENDER",
    dimension_name: "gender",
    dimension_type: "categorical",
    allowed_values: ["male", "female", "other", "unknown"],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_CONTRACT_TYPE",
    dimension_name: "contract_type",
    dimension_type: "categorical",
    allowed_values: ["full_time", "part_time"],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_STUDENT_LEVEL",
    dimension_name: "student_level",
    dimension_type: "categorical",
    allowed_values: ["undergraduate", "graduate", "professional"],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_ENROLLMENT_STATUS",
    dimension_name: "enrollment_status",
    dimension_type: "categorical",
    allowed_values: ["full_time", "part_time"],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_DEGREE_LEVEL",
    dimension_name: "degree_level",
    dimension_type: "categorical",
    allowed_values: ["bachelor", "master", "doctorate", "certificate"],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_DISCIPLINE",
    dimension_name: "discipline",
    dimension_type: "categorical",
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_RANK",
    dimension_name: "rank",
    dimension_type: "categorical",
    allowed_values: [
      "professor",
      "associate_professor",
      "assistant_professor",
      "instructor",
      "lecturer",
    ],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_FUND_TYPE",
    dimension_name: "fund_type",
    dimension_type: "categorical",
    allowed_values: ["restricted", "unrestricted"],
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    dimension_id: "DIM_GEOGRAPHY",
    dimension_name: "geography",
    dimension_type: "categorical",
    allowed_values: ["in_state", "out_of_state", "international"],
    created_at: "2024-01-10T08:00:00Z",
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Retrieve an enhanced metric definition by its metric_id.
 * Returns undefined if no metric with the given ID exists.
 */
export function getEnhancedMetricById(
  id: string
): EnhancedMetricDefinition | undefined {
  return enhancedMetricDefinitions.find((m) => m.metric_id === id);
}

/**
 * Retrieve all enhanced metric definitions belonging to a given domain.
 * Domain matching is case-insensitive.
 */
export function getEnhancedMetricsByDomain(
  domain: string
): EnhancedMetricDefinition[] {
  const normalizedDomain = domain.toLowerCase();
  return enhancedMetricDefinitions.filter(
    (m) => m.domain.toLowerCase() === normalizedDomain
  );
}

/**
 * Retrieve all aliases associated with a given metric_id.
 */
export function getAliasesForMetric(metricId: string): MetricAlias[] {
  return metricAliases.filter((a) => a.metric_id === metricId);
}

/**
 * Retrieve a dimension definition by its dimension_name.
 * Name matching is case-insensitive.
 * Returns undefined if no dimension with the given name exists.
 */
export function getDimensionByName(name: string): Dimension | undefined {
  const normalizedName = name.toLowerCase();
  return dimensions.find(
    (d) => d.dimension_name.toLowerCase() === normalizedName
  );
}
