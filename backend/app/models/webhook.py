"""Webhook data models for n8n integration."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date, datetime


class N8NObservation(BaseModel):
    """Single observation from n8n automation."""
    raw_metric_name: str = Field(..., description="Raw metric name from n8n")
    dimensions: Dict[str, str] = Field(default_factory=dict, description="Dimension key-value pairs")
    value: float = Field(..., description="Metric value")
    aggregation: str = Field(..., description="Aggregation description")


class N8NWebhookPayload(BaseModel):
    """Payload received from n8n webhook."""
    data: List[N8NObservation] = Field(..., description="List of observations")
    entity_id: str = Field(..., description="Entity identifier for these observations")
    source_url: Optional[str] = Field(None, description="URL of source document")
    observation_date: Optional[date] = Field(None, description="Observation date (defaults to today)")
    source_name: Optional[str] = Field(None, description="Name of the source")


class MetricMappingConfig(BaseModel):
    """Configuration for mapping raw metric names to canonical metrics."""
    config_id: Optional[str] = Field(None, description="Configuration ID (auto-generated)")
    raw_metric_name: str = Field(..., description="Raw metric name from n8n")
    metric_id: str = Field(..., description="Canonical metric ID from glossary")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Mapping confidence")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WebhookProcessingResult(BaseModel):
    """Result of processing webhook payload."""
    success_count: int = Field(..., description="Number of successfully processed observations")
    error_count: int = Field(..., description="Number of failed observations")
    total_count: int = Field(..., description="Total number of observations")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="List of errors with details")
    created_metrics: List[str] = Field(default_factory=list, description="List of auto-created metric IDs")
    observation_ids: List[str] = Field(default_factory=list, description="List of created observation IDs")
