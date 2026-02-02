"""Mock data for extraction API."""

from datetime import datetime

from app.models import (
    ExtractionRule,
    ExtractionPattern,
    SemanticMapping,
    ValidationRule,
    ExtractionTemplate,
    ExtractionJob,
    ExtractionResult,
    ExtractionSource,
    PatternType,
    ExtractionMethod,
    ResultStatus,
)


# ============ Mock Extraction Rules ============

MOCK_RULES = [
    ExtractionRule(
        id="rule-total-revenue",
        name="Total Operating Revenue",
        description="Extract total operating revenue from financial documents",
        target_metric_id="metric-total-revenue",
        target_metric_name="Total Operating Revenue",
        is_active=True,
        extraction_method=ExtractionMethod.HYBRID,
        unit="currency",
        patterns=[
            ExtractionPattern(
                id="pat-rev-1",
                type=PatternType.LABEL_VALUE,
                pattern="Total Operating Revenue",
                priority=1,
                confidence=0.95,
                examples=["Total Operating Revenue: $1,234,567,890", "Total Operating Revenue $1.2B"]
            ),
            ExtractionPattern(
                id="pat-rev-2",
                type=PatternType.REGEX,
                pattern=r"(?:Total|Gross)\s+(?:Operating\s+)?Revenue[:\s]+\$?([\d,]+(?:\.\d+)?)\s*([BMK]|billion|million)?",
                priority=2,
                confidence=0.9,
                examples=["Gross Revenue: $500M", "Total Revenue $1,500,000,000"]
            ),
            ExtractionPattern(
                id="pat-rev-3",
                type=PatternType.TABLE_HEADER,
                pattern="Total Revenue",
                priority=3,
                confidence=0.85,
                examples=[]
            ),
        ],
        semantic_mappings=[
            SemanticMapping(
                id="sem-rev-1",
                canonical_term="Total Operating Revenue",
                variations=[
                    "Total Revenue",
                    "Gross Revenue",
                    "Operating Revenue",
                    "Total Income",
                    "Revenue Total",
                    "Net Revenue",
                    "Total Operating Income"
                ],
                context="financial",
                weight=1.0
            )
        ],
        validation_rules=[
            ValidationRule(
                id="val-rev-1",
                type="range",
                params={"min": 0, "max": 100_000_000_000},
                error_message="Revenue must be between 0 and $100B"
            )
        ]
    ),
    ExtractionRule(
        id="rule-enrollment",
        name="Total Enrollment",
        description="Extract total student enrollment",
        target_metric_id="metric-total-enrollment",
        target_metric_name="Total Fall Enrollment",
        is_active=True,
        extraction_method=ExtractionMethod.HYBRID,
        unit="count",
        patterns=[
            ExtractionPattern(
                id="pat-enr-1",
                type=PatternType.LABEL_VALUE,
                pattern="Total Enrollment",
                priority=1,
                confidence=0.95,
                examples=["Total Enrollment: 45,000", "Total Enrollment 52,341"]
            ),
            ExtractionPattern(
                id="pat-enr-2",
                type=PatternType.REGEX,
                pattern=r"(?:Total|Fall)\s+(?:Student\s+)?Enrollment[:\s]+([\d,]+)",
                priority=2,
                confidence=0.9,
                examples=["Fall Enrollment: 48,500"]
            ),
        ],
        semantic_mappings=[
            SemanticMapping(
                id="sem-enr-1",
                canonical_term="Total Enrollment",
                variations=[
                    "Total Student Enrollment",
                    "Fall Enrollment",
                    "Student Headcount",
                    "Total Headcount",
                    "Enrolled Students",
                    "Total Students"
                ],
                context="enrollment",
                weight=1.0
            )
        ],
        validation_rules=[
            ValidationRule(
                id="val-enr-1",
                type="range",
                params={"min": 0, "max": 200_000},
                error_message="Enrollment must be between 0 and 200,000"
            )
        ]
    ),
    ExtractionRule(
        id="rule-retention",
        name="Retention Rate",
        description="Extract first-year retention rate",
        target_metric_id="metric-retention-rate",
        target_metric_name="First-Year Retention Rate",
        is_active=True,
        extraction_method=ExtractionMethod.HYBRID,
        unit="percentage",
        patterns=[
            ExtractionPattern(
                id="pat-ret-1",
                type=PatternType.LABEL_VALUE,
                pattern="Retention Rate",
                priority=1,
                confidence=0.95,
                examples=["Retention Rate: 94%", "Retention Rate 91.5%"]
            ),
            ExtractionPattern(
                id="pat-ret-2",
                type=PatternType.REGEX,
                pattern=r"(?:First[- ]Year\s+)?Retention\s+Rate[:\s]+([\d.]+)\s*%?",
                priority=2,
                confidence=0.9,
                examples=["First-Year Retention Rate: 93.2%"]
            ),
        ],
        semantic_mappings=[
            SemanticMapping(
                id="sem-ret-1",
                canonical_term="Retention Rate",
                variations=[
                    "First-Year Retention Rate",
                    "Freshman Retention Rate",
                    "First Year Retention",
                    "Student Retention Rate",
                    "Retention Percentage",
                    "1st Year Retention"
                ],
                context="retention",
                weight=1.0
            )
        ],
        validation_rules=[
            ValidationRule(
                id="val-ret-1",
                type="range",
                params={"min": 0, "max": 100},
                error_message="Retention rate must be between 0% and 100%"
            )
        ]
    ),
    ExtractionRule(
        id="rule-research",
        name="Research Expenditures",
        description="Extract total research and development expenditures",
        target_metric_id="metric-research-expenditure",
        target_metric_name="Research Expenditures",
        is_active=True,
        extraction_method=ExtractionMethod.HYBRID,
        unit="currency",
        patterns=[
            ExtractionPattern(
                id="pat-res-1",
                type=PatternType.LABEL_VALUE,
                pattern="Research Expenditures",
                priority=1,
                confidence=0.95,
                examples=["Research Expenditures: $750M", "Research Expenditures $1.2B"]
            ),
            ExtractionPattern(
                id="pat-res-2",
                type=PatternType.REGEX,
                pattern=r"(?:Total\s+)?(?:Research|R&D)\s+(?:Expenditure|Spending)s?[:\s]+\$?([\d,]+(?:\.\d+)?)\s*([BMK]|billion|million)?",
                priority=2,
                confidence=0.9,
                examples=["R&D Spending: $500M"]
            ),
        ],
        semantic_mappings=[
            SemanticMapping(
                id="sem-res-1",
                canonical_term="Research Expenditures",
                variations=[
                    "R&D Expenditures",
                    "Research Spending",
                    "Research & Development",
                    "Total Research Funding",
                    "Research Budget",
                    "R&D Spending"
                ],
                context="research",
                weight=1.0
            )
        ],
        validation_rules=[]
    ),
    ExtractionRule(
        id="rule-endowment",
        name="Endowment Value",
        description="Extract endowment market value",
        target_metric_id="metric-endowment",
        target_metric_name="Endowment Market Value",
        is_active=True,
        extraction_method=ExtractionMethod.HYBRID,
        unit="currency",
        patterns=[
            ExtractionPattern(
                id="pat-end-1",
                type=PatternType.LABEL_VALUE,
                pattern="Endowment",
                priority=1,
                confidence=0.9,
                examples=["Endowment: $5.2B", "Endowment Value $12,500,000,000"]
            ),
        ],
        semantic_mappings=[
            SemanticMapping(
                id="sem-end-1",
                canonical_term="Endowment",
                variations=[
                    "Endowment Value",
                    "Endowment Market Value",
                    "Total Endowment",
                    "Endowment Assets",
                    "Endowment Fund"
                ],
                context="financial",
                weight=1.0
            )
        ],
        validation_rules=[]
    ),
    ExtractionRule(
        id="rule-grad-rate",
        name="Graduation Rate",
        description="Extract 6-year graduation rate",
        target_metric_id="metric-6yr-grad-rate",
        target_metric_name="Six-Year Graduation Rate",
        is_active=True,
        extraction_method=ExtractionMethod.HYBRID,
        unit="percentage",
        patterns=[
            ExtractionPattern(
                id="pat-grad-1",
                type=PatternType.LABEL_VALUE,
                pattern="Graduation Rate",
                priority=1,
                confidence=0.9,
                examples=["Graduation Rate: 85%", "6-Year Graduation Rate 87.5%"]
            ),
            ExtractionPattern(
                id="pat-grad-2",
                type=PatternType.REGEX,
                pattern=r"(?:6[- ]Year\s+)?Graduation\s+Rate[:\s]+([\d.]+)\s*%?",
                priority=2,
                confidence=0.85,
                examples=["Six-Year Graduation Rate: 82%"]
            ),
        ],
        semantic_mappings=[
            SemanticMapping(
                id="sem-grad-1",
                canonical_term="Graduation Rate",
                variations=[
                    "6-Year Graduation Rate",
                    "Six-Year Graduation Rate",
                    "Completion Rate",
                    "6 Year Grad Rate",
                    "Graduate Rate"
                ],
                context="graduation",
                weight=1.0
            )
        ],
        validation_rules=[
            ValidationRule(
                id="val-grad-1",
                type="range",
                params={"min": 0, "max": 100},
                error_message="Graduation rate must be between 0% and 100%"
            )
        ]
    ),
]


# ============ Mock Templates ============

MOCK_TEMPLATES = [
    ExtractionTemplate(
        id="tmpl-financial",
        name="Financial Report Template",
        description="Extract financial metrics from annual reports",
        document_types=["pdf", "excel"],
        rule_ids=["rule-total-revenue", "rule-endowment", "rule-research"],
        is_default=True
    ),
    ExtractionTemplate(
        id="tmpl-enrollment",
        name="Enrollment Report Template",
        description="Extract enrollment and retention metrics",
        document_types=["pdf", "excel", "powerpoint"],
        rule_ids=["rule-enrollment", "rule-retention", "rule-grad-rate"],
        is_default=False
    ),
    ExtractionTemplate(
        id="tmpl-comprehensive",
        name="Comprehensive Extraction",
        description="Extract all available metrics",
        document_types=["pdf", "excel", "word", "powerpoint"],
        rule_ids=[r.id for r in MOCK_RULES],
        is_default=False
    ),
]


# ============ Mock Jobs & Results ============

MOCK_RESULTS = [
    ExtractionResult(
        id="res-001",
        job_id="job-001",
        document_id="doc-001",
        document_name="Annual Financial Report FY2024.pdf",
        rule_id="rule-total-revenue",
        metric_id="metric-total-revenue",
        metric_name="Total Operating Revenue",
        extracted_value="1,850,000,000",
        normalized_value=1_850_000_000,
        unit="currency",
        fiscal_year=2024,
        confidence=0.92,
        source=ExtractionSource(
            page=12,
            section="Financial Summary",
            context="...Total Operating Revenue for FY2024 reached $1,850,000,000, representing a 3.2% increase...",
            matched_pattern="Total Operating Revenue",
            raw_text="Total Operating Revenue for FY2024 reached $1,850,000,000"
        ),
        status=ResultStatus.PENDING_REVIEW
    ),
    ExtractionResult(
        id="res-002",
        job_id="job-001",
        document_id="doc-001",
        document_name="Annual Financial Report FY2024.pdf",
        rule_id="rule-endowment",
        metric_id="metric-endowment",
        metric_name="Endowment Market Value",
        extracted_value="920,000,000",
        normalized_value=920_000_000,
        unit="currency",
        fiscal_year=2024,
        confidence=0.88,
        source=ExtractionSource(
            page=15,
            section="Endowment Report",
            context="...The university's endowment reached $920 million as of June 30, 2024...",
            matched_pattern="endowment",
            raw_text="endowment reached $920 million"
        ),
        status=ResultStatus.APPROVED
    ),
    ExtractionResult(
        id="res-003",
        job_id="job-001",
        document_id="doc-002",
        document_name="Board Presentation Q4.pptx",
        rule_id="rule-enrollment",
        metric_id="metric-total-enrollment",
        metric_name="Total Fall Enrollment",
        extracted_value="32,450",
        normalized_value=32_450,
        unit="count",
        fiscal_year=2024,
        confidence=0.95,
        source=ExtractionSource(
            page=5,
            section="Enrollment Overview",
            context="Fall 2024 Total Enrollment: 32,450 students",
            matched_pattern="Total Enrollment",
            raw_text="Total Enrollment: 32,450"
        ),
        status=ResultStatus.PENDING_REVIEW
    ),
]

MOCK_JOBS = [
    ExtractionJob(
        id="job-001",
        document_ids=["doc-001", "doc-002"],
        template_id="tmpl-comprehensive",
        rule_ids=[r.id for r in MOCK_RULES],
        method=ExtractionMethod.HYBRID,
        status="completed",
        progress=100.0,
        results=MOCK_RESULTS,
        errors=[]
    )
]
