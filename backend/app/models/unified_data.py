"""Unified data model for entities, dimensions, and metrics."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.models.glossary import MetricDomain


class Entity(BaseModel):
    """Base entity model."""
    id: str
    type: str = Field(..., description="Entity type (Institution, Document, etc.)")
    name: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Dimension(BaseModel):
    """Dimension model for filtering and grouping."""
    id: str
    name: str
    type: str = Field(..., description="Dimension type (time, geography, categorical)")
    value: Any = Field(..., description="Dimension value")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractedDataPoint(BaseModel):
    """Single extracted data point with context."""
    id: str
    metric_id: str
    metric_name: str
    domain: MetricDomain
    value: float
    unit: str
    entity_id: str
    entity_type: str
    dimension_values: Dict[str, Any] = Field(default_factory=dict, description="Dimension values (fiscal_year, document_type, etc.)")
    confidence: float = Field(ge=0.0, le=1.0)
    source_document_id: Optional[str] = None
    extraction_job_id: Optional[str] = None
    extracted_text: Optional[str] = Field(None, description="Original text that was extracted")
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    validated_at: Optional[datetime] = None
    validation_status: str = Field(default="pending_review", description="pending_review, approved, rejected")
    notes: Optional[str] = None


class FactMetric(BaseModel):
    """Fact table entry for extracted metrics."""
    id: str
    entity_id: str
    metric_id: str
    domain: MetricDomain
    dimension_values: Dict[str, Any] = Field(default_factory=dict)
    value: float
    unit: str
    confidence: float = Field(ge=0.0, le=1.0)
    source_document_id: Optional[str] = None
    extraction_job_id: Optional[str] = None
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    validated_at: Optional[datetime] = None
    validation_status: str = Field(default="pending_review")
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "fact-001",
                "entity_id": "inst-001",
                "metric_id": "metric-total-revenue",
                "domain": "finance",
                "dimension_values": {"fiscal_year": 2024, "document_type": "pdf"},
                "value": 1234567890.0,
                "unit": "currency",
                "confidence": 0.95,
                "source_document_id": "doc-001",
                "extraction_job_id": "job-001",
                "validation_status": "pending_review"
            }
        }


class ComparisonQuery(BaseModel):
    """Query parameters for comparing metrics."""
    metric_ids: List[str]
    entity_ids: Optional[List[str]] = None
    domain: Optional[MetricDomain] = None
    fiscal_years: Optional[List[int]] = None
    fiscal_year_start: Optional[int] = None
    fiscal_year_end: Optional[int] = None
    group_by: Optional[List[str]] = Field(None, description="Group by dimensions (fiscal_year, entity_id, etc.)")
    include_pending: bool = Field(default=False, description="Include pending review values")


class ComparisonResult(BaseModel):
    """Result of a metric comparison."""
    metric_id: str
    metric_name: str
    domain: MetricDomain
    data_points: List[FactMetric]
    aggregated: Optional[Dict[str, Any]] = None
    comparison_stats: Optional[Dict[str, Any]] = None
