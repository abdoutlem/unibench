"""Pydantic models for the analytics explore endpoint."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ExploreFilters(BaseModel):
    """Filters for the explore query."""
    entity_ids: List[str] = Field(default_factory=list, description="Filter to specific entities")
    fiscal_year_start: Optional[int] = Field(None, description="Start fiscal year (inclusive)")
    fiscal_year_end: Optional[int] = Field(None, description="End fiscal year (inclusive)")
    dimension_filters: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Dimension name -> list of allowed values"
    )


class ExploreRequest(BaseModel):
    """Request body for the analytics explore endpoint."""
    metric_ids: List[str] = Field(..., min_length=1, description="One or more metric IDs to query")
    group_by: List[str] = Field(default_factory=list, description="Dimensions to group by (fiscal_year, entity_id, geography, etc.)")
    filters: ExploreFilters = Field(default_factory=ExploreFilters)
    aggregation: str = Field("sum", description="Aggregation function: sum, average, median, min, max, count, latest")
    sort_by: Optional[str] = Field("value", description="Column to sort by")
    sort_order: str = Field("desc", description="Sort order: asc or desc")
    limit: int = Field(500, ge=1, le=10000, description="Maximum number of rows to return")


class ColumnDef(BaseModel):
    """Definition of a column in the explore response."""
    name: str
    type: str = Field(description="string, number, date")
    unit: Optional[str] = Field(None, description="Unit of measurement if applicable")


class ExploreResponse(BaseModel):
    """Response from the analytics explore endpoint."""
    columns: List[ColumnDef]
    rows: List[Dict[str, Any]]
    total_rows: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EntityListItem(BaseModel):
    """An entity returned by the entity listing endpoint."""
    entity_id: str
    entity_name: str
    entity_type: str
