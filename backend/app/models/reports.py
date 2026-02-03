"""Pydantic models for saved reports."""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CreateReportRequest(BaseModel):
    """Request to create a new saved report."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    tags: List[str] = Field(default_factory=list)
    query_config: Dict[str, Any] = Field(..., description="Serialized ExploreRequest")
    chart_type: str = Field(..., description="Chart type: line, bar, bar_horizontal, stacked_bar, area, pie, donut, table")
    chart_config: Dict[str, Any] = Field(default_factory=dict)


class UpdateReportRequest(BaseModel):
    """Request to update a saved report."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    tags: Optional[List[str]] = None
    query_config: Optional[Dict[str, Any]] = None
    chart_type: Optional[str] = None
    chart_config: Optional[Dict[str, Any]] = None


class SavedReportResponse(BaseModel):
    """Response model for a saved report."""
    report_id: str
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    query_config: Dict[str, Any]
    chart_type: str
    chart_config: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
