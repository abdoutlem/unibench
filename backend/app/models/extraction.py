"""Extraction data models."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class PatternType(str, Enum):
    """Types of extraction patterns."""
    EXACT = "exact"
    REGEX = "regex"
    FUZZY = "fuzzy"
    SEMANTIC = "semantic"
    TABLE_HEADER = "table_header"
    LABEL_VALUE = "label_value"
    CONTEXT = "context"


class ExtractionMethod(str, Enum):
    """Extraction method selection."""
    AI = "ai"
    RULE_BASED = "rule_based"
    HYBRID = "hybrid"


class ResultStatus(str, Enum):
    """Status of extraction results."""
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    MODIFIED = "modified"


class SemanticMapping(BaseModel):
    """Maps variations of terms to a canonical form."""
    id: str
    canonical_term: str = Field(..., description="The standard term to normalize to")
    variations: list[str] = Field(default_factory=list, description="Alternative phrasings")
    context: Optional[str] = Field(None, description="Context where this mapping applies")
    weight: float = Field(1.0, ge=0, le=1, description="Confidence weight for this mapping")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "sem-001",
                "canonical_term": "Total Revenue",
                "variations": [
                    "Total Operating Revenue",
                    "Gross Revenue",
                    "Operating Revenue",
                    "Total Income",
                    "Revenue Total"
                ],
                "context": "financial",
                "weight": 1.0
            }
        }


class ExtractionPattern(BaseModel):
    """Pattern for extracting data from documents."""
    id: str
    type: PatternType
    pattern: str = Field(..., description="The pattern string (regex, exact match, etc.)")
    priority: int = Field(1, ge=1, le=10, description="Priority when multiple patterns match")
    confidence: float = Field(0.8, ge=0, le=1, description="Base confidence score")
    examples: list[str] = Field(default_factory=list, description="Example matches")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "pat-001",
                "type": "label_value",
                "pattern": r"Total\s+Revenue[:\s]+\$?([\d,]+(?:\.\d{2})?)",
                "priority": 1,
                "confidence": 0.9,
                "examples": ["Total Revenue: $1,234,567", "Total Revenue $1.2B"]
            }
        }


class ValidationRule(BaseModel):
    """Rule for validating extracted values."""
    id: str
    type: str = Field(..., description="Validation type: range, type, format, required")
    params: dict = Field(default_factory=dict, description="Validation parameters")
    error_message: str


class ExtractionRule(BaseModel):
    """Complete rule for extracting a specific metric."""
    id: str
    name: str
    description: str
    target_metric_id: str = Field(..., description="ID of the metric this rule extracts")
    target_metric_name: str
    is_active: bool = True
    extraction_method: ExtractionMethod = ExtractionMethod.HYBRID
    patterns: list[ExtractionPattern] = Field(default_factory=list)
    semantic_mappings: list[SemanticMapping] = Field(default_factory=list)
    validation_rules: list[ValidationRule] = Field(default_factory=list)
    unit: str = Field("", description="Expected unit: currency, percentage, count, etc.")
    fiscal_year_pattern: Optional[str] = Field(None, description="Pattern to extract fiscal year")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractionTemplate(BaseModel):
    """Template grouping multiple extraction rules."""
    id: str
    name: str
    description: str
    document_types: list[str] = Field(default_factory=list, description="Applicable doc types")
    rule_ids: list[str] = Field(default_factory=list)
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractionSource(BaseModel):
    """Source information for an extracted value."""
    page: Optional[int] = None
    section: Optional[str] = None
    context: str = Field(..., description="Surrounding text context")
    matched_pattern: Optional[str] = None
    raw_text: str = Field(..., description="Original text that was matched")


class ExtractionResult(BaseModel):
    """Result of extracting a single value."""
    id: str
    job_id: str
    document_id: str
    document_name: str
    rule_id: str
    metric_id: str
    metric_name: str
    extracted_value: Optional[str | float] = None
    normalized_value: Optional[float] = None
    unit: str = ""
    fiscal_year: Optional[int] = None
    confidence: float = Field(0.0, ge=0, le=1)
    source: ExtractionSource
    status: ResultStatus = ResultStatus.PENDING_REVIEW
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None
    dimensions: Optional[dict] = Field(default_factory=dict, description="Additional dimensions like geography, location, etc.")


class ExtractionJob(BaseModel):
    """Extraction job tracking."""
    id: str
    document_ids: list[str]
    template_id: Optional[str] = None
    rule_ids: list[str]
    method: ExtractionMethod
    status: str = "queued"  # queued, processing, completed, failed, cancelled
    progress: float = 0.0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    results: list[ExtractionResult] = Field(default_factory=list)
    errors: list[dict] = Field(default_factory=list)


class AIConfig(BaseModel):
    """Configuration for AI-based extraction."""
    enabled: bool = True
    provider: str = Field("anthropic", description="AI provider: anthropic, openai")
    model: str = Field("claude-sonnet-4-20250514", description="Model to use")
    temperature: float = Field(0.1, ge=0, le=1)
    max_tokens: int = Field(4096, ge=100)
    fallback_to_rules: bool = Field(True, description="Use rules if AI fails")

    # Prompt customization
    system_prompt: Optional[str] = None
    extraction_prompt_template: str = Field(
        default="""Extract ALL occurrences of the following metric from the document text. Return EVERY matching value you find.

Metric to extract: {metric_name}
Description: {metric_description}
Expected unit: {unit}

Known variations of this metric:
{variations}

Document text:
{text}

CRITICAL INSTRUCTIONS - Extract ALL matching values and return them as an array:

1. SCAN THE ENTIRE DOCUMENT for this metric
2. Find EVERY occurrence of this metric (even if values differ)
3. Extract each occurrence with its own context, dimensions, and geography
4. Return ALL results in an array

For EACH occurrence, extract:

ENTITY: Identify the entity this metric applies to
   - entity_type: Type of entity (e.g., "Institution", "Department", "Program", "Campus", "Location")
   - entity_name: Name or identifier of the entity
   - entity_id: Unique identifier if found

DIMENSIONS: Extract all relevant dimension values
   - fiscal_year: Fiscal year if mentioned
   - document_type: Type of document (e.g., "pdf", "financial_statement", "report")
   - period: Time period if mentioned (e.g., "Q1 2024", "FY2024")
   - geography: Geographic location (country, state, city, region, campus name, etc.) - REQUIRED if mentioned
   - location: Specific location name (campus, building, department location)
   - Any other dimensions mentioned in the text

METRIC: Extract the metric value
   - value: Numeric value (convert millions/billions to full number)
   - unit: Unit of measurement
   - confidence: Your confidence score (0.0-1.0)

SOURCE: Where you found the data
   - raw_text: Exact text where value was found
   - page_number: Page number if available
   - context: Surrounding context (50-100 words)

You MUST respond in this exact JSON format (no markdown, no code blocks):
{{
    "results": [
        {{
            "entity": {{
                "type": "<entity_type>",
                "name": "<entity_name>",
                "id": "<entity_id or null>"
            }},
            "dimensions": {{
                "fiscal_year": <year or null>,
                "document_type": "<type or null>",
                "period": "<period or null>",
                "geography": "<country/state/city/region/campus or null>",
                "location": "<specific location name or null>",
                "additional_dimensions": {{}}
            }},
            "metric": {{
                "value": <number or null>,
                "unit": "<unit>",
                "confidence": <0.0-1.0>,
                "metric_name": "{metric_name}"
            }},
            "source": {{
                "raw_text": "<exact text matched>",
                "page_number": <number or null>,
                "context": "<surrounding context>"
            }},
            "fiscal_year": <year or null>,
            "notes": "<any relevant notes or null>"
        }}
    ]
}}

IMPORTANT:
- Return ALL matching values in the "results" array
- If NO values found, return empty array: {{"results": []}}
- Each result should have its own entity, dimensions, and source
- Always extract geography/location if mentioned (country, state, city, campus, region)
- confidence MUST be between 0.0 and 1.0 for each result
- If the same metric appears multiple times with different contexts, include ALL of them"""
    )
