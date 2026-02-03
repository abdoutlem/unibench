"""Data source models for tracking URLs and documents."""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field


class DataSourceType(str, Enum):
    """Type of data source."""
    DOCUMENT = "document"
    URL = "url"
    API = "api"
    WEBHOOK = "webhook"


class DataSourceStatus(str, Enum):
    """Status of data source processing."""
    PENDING = "pending"
    PROCESSING = "processing"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PAUSED = "paused"


class UpdateFrequency(str, Enum):
    """Update frequency for data sources."""
    MANUAL = "manual"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class DataSource(BaseModel):
    """Data source model."""
    id: str
    name: str
    type: DataSourceType
    description: Optional[str] = None
    status: DataSourceStatus = DataSourceStatus.PENDING
    
    # Configuration
    update_frequency: UpdateFrequency = UpdateFrequency.MANUAL
    last_update: Optional[datetime] = None
    next_update: Optional[datetime] = None
    auto_extract: bool = True
    
    # Type-specific configuration
    url: Optional[str] = None  # For URL type
    document_ids: Optional[List[str]] = None  # For document type
    webhook_url: Optional[str] = None  # For webhook type
    api_endpoint: Optional[str] = None  # For API type
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = "system"
    
    # Status information
    last_success: Optional[datetime] = None
    last_error: Optional[str] = None
    error_count: int = 0
    success_count: int = 0
    
    # Extraction configuration
    extraction_rules: Optional[List[str]] = None
    extraction_method: Optional[str] = "HYBRID"  # HYBRID, RULE_BASED, AI
    
    # Additional settings
    enabled: bool = True
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class DataSourceCreate(BaseModel):
    """Model for creating a new data source."""
    name: str
    type: DataSourceType
    description: Optional[str] = None
    url: Optional[str] = None
    document_ids: Optional[List[str]] = None
    webhook_url: Optional[str] = None
    api_endpoint: Optional[str] = None
    update_frequency: UpdateFrequency = UpdateFrequency.MANUAL
    auto_extract: bool = True
    extraction_rules: Optional[List[str]] = None
    extraction_method: Optional[str] = "HYBRID"
    enabled: bool = True
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None


class DataSourceStatusUpdate(BaseModel):
    """Model for updating data source status."""
    status: DataSourceStatus
    error_message: Optional[str] = None
    observations_processed: Optional[int] = None
    observations_failed: Optional[int] = None
