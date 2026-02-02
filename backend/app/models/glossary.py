"""Glossary data models for centralized metric definitions."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MetricDomain(str, Enum):
    """Core metric domains for the internal platform."""
    STUDENTS = "students"
    FACULTY = "faculty"
    RESEARCH = "research"
    ADMINISTRATIVE_STAFF = "administrative_staff"
    OPERATIONS = "operations"
    FINANCE = "finance"


class ValidationRuleType(str, Enum):
    """Types of validation rules."""
    RANGE = "range"
    TYPE = "type"
    FORMAT = "format"
    REQUIRED = "required"
    CUSTOM = "custom"


class ValidationRule(BaseModel):
    """Rule for validating extracted values."""
    type: ValidationRuleType
    params: Dict[str, Any] = Field(default_factory=dict)
    error_message: str


class SemanticVariation(BaseModel):
    """Semantic variation or synonym for a metric."""
    id: str
    metric_id: str
    variation: str
    context: Optional[str] = None
    weight: float = Field(1.0, ge=0.0, le=1.0, description="Confidence weight for this variation")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GlossaryMetric(BaseModel):
    """Complete glossary definition for a metric."""
    id: str
    domain: MetricDomain
    name: str
    canonical_name: str = Field(..., description="Standard name for this metric")
    description: str
    calculation_logic: str = Field(..., description="How this metric is calculated")
    data_owner: str = Field(..., description="Department or person responsible for this metric")
    source: str = Field(..., description="Primary data source (internal-document, ipeds, etc.)")
    update_frequency: str = Field(..., description="How often this metric is updated (annual, quarterly, etc.)")
    unit: str = Field(..., description="Unit of measurement (currency, percentage, count, etc.)")
    semantic_variations: List[str] = Field(default_factory=list, description="Alternative names/phrasings")
    validation_rules: List[ValidationRule] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list, description="Entity types this metric applies to")
    dimensions: List[str] = Field(default_factory=list, description="Dimension types (FiscalYear, DocumentType, etc.)")
    version: str = "1.0"
    effective_date: str = Field(..., description="Date when this definition became effective")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "id": "metric-total-revenue",
                "domain": "finance",
                "name": "Total Operating Revenue",
                "canonical_name": "Total Operating Revenue",
                "description": "Total revenue from all operating sources",
                "calculation_logic": "Sum of all operating revenue line items",
                "data_owner": "Finance Department",
                "source": "internal-document",
                "update_frequency": "annual",
                "unit": "currency",
                "semantic_variations": ["Total Revenue", "Gross Revenue", "Operating Revenue"],
                "validation_rules": [{"type": "range", "params": {"min": 0, "max": 100000000000}, "error_message": "Value must be positive"}],
                "entities": ["Institution"],
                "dimensions": ["FiscalYear", "DocumentType"],
                "version": "1.0",
                "effective_date": "2024-01-01"
            }
        }


class EntityDefinition(BaseModel):
    """Definition of an entity type."""
    id: str
    name: str
    description: str
    attributes: Dict[str, str] = Field(default_factory=dict, description="Key attributes of this entity")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DimensionDefinition(BaseModel):
    """Definition of a dimension type."""
    id: str
    name: str
    description: str
    type: str = Field(..., description="Type: time, geography, categorical, etc.")
    values: Optional[List[str]] = Field(None, description="Allowed values if categorical")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GlossaryMatch(BaseModel):
    """Result of matching text to a glossary metric."""
    metric_id: str
    metric_name: str
    domain: MetricDomain
    matched_text: str
    confidence: float = Field(ge=0.0, le=1.0)
    matched_variation: Optional[str] = None
    context: Optional[str] = None
