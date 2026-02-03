"""Data source management endpoints."""

import uuid
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from app.models.datasource import (
    DataSource,
    DataSourceCreate,
    DataSourceStatusUpdate,
    DataSourceStatus,
    DataSourceType,
    UpdateFrequency
)

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for Phase 0 (replace with database later)
datasources_db: dict[str, DataSource] = {}


class StatusUpdateRequest(BaseModel):
    """Request model for status updates from external processing system."""
    source_id: str
    status: DataSourceStatus
    error_message: Optional[str] = None
    observations_processed: Optional[int] = None
    observations_failed: Optional[int] = None


@router.post("", response_model=DataSource)
async def create_datasource(datasource: DataSourceCreate) -> DataSource:
    """Create a new data source."""
    datasource_id = f"ds-{uuid.uuid4().hex[:12]}"
    
    # Validate type-specific fields
    if datasource.type == DataSourceType.URL and not datasource.url:
        raise HTTPException(status_code=400, detail="URL is required for URL type datasource")
    if datasource.type == DataSourceType.DOCUMENT and not datasource.document_ids:
        raise HTTPException(status_code=400, detail="document_ids is required for document type datasource")
    
    # Create datasource
    new_datasource = DataSource(
        id=datasource_id,
        name=datasource.name,
        type=datasource.type,
        description=datasource.description,
        status=DataSourceStatus.PENDING,
        update_frequency=datasource.update_frequency,
        auto_extract=datasource.auto_extract,
        url=datasource.url,
        document_ids=datasource.document_ids,
        webhook_url=datasource.webhook_url,
        api_endpoint=datasource.api_endpoint,
        extraction_rules=datasource.extraction_rules,
        extraction_method=datasource.extraction_method,
        enabled=datasource.enabled,
        tags=datasource.tags or [],
        notes=datasource.notes,
        created_by=datasource.created_by or "system",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    datasources_db[datasource_id] = new_datasource
    logger.info(f"Created datasource: {datasource_id} ({datasource.name})")
    
    return new_datasource


@router.get("", response_model=List[DataSource])
async def list_datasources(
    type: Optional[DataSourceType] = None,
    status: Optional[DataSourceStatus] = None,
    enabled: Optional[bool] = None
) -> List[DataSource]:
    """List all data sources with optional filtering."""
    datasources = list(datasources_db.values())
    
    if type:
        datasources = [ds for ds in datasources if ds.type == type]
    if status:
        datasources = [ds for ds in datasources if ds.status == status]
    if enabled is not None:
        datasources = [ds for ds in datasources if ds.enabled == enabled]
    
    return datasources


@router.get("/{datasource_id}", response_model=DataSource)
async def get_datasource(datasource_id: str) -> DataSource:
    """Get a specific data source by ID."""
    if datasource_id not in datasources_db:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    return datasources_db[datasource_id]


@router.post("/{datasource_id}/status", response_model=DataSource)
async def update_datasource_status(
    datasource_id: str,
    status_update: DataSourceStatusUpdate
) -> DataSource:
    """Update the status of a data source."""
    if datasource_id not in datasources_db:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    datasource = datasources_db[datasource_id]
    
    # Update status
    datasource.status = status_update.status
    datasource.updated_at = datetime.utcnow()
    
    # Update last success/error timestamps
    if status_update.status == DataSourceStatus.ACTIVE:
        datasource.last_success = datetime.utcnow()
        if status_update.observations_processed:
            datasource.success_count += status_update.observations_processed
    elif status_update.status == DataSourceStatus.ERROR:
        datasource.last_error = status_update.error_message or "Unknown error"
        datasource.error_count += 1
        if status_update.observations_failed:
            datasource.error_count += status_update.observations_failed
    
    # Update counts
    if status_update.observations_processed:
        datasource.success_count += status_update.observations_processed
    if status_update.observations_failed:
        datasource.error_count += status_update.observations_failed
    
    datasources_db[datasource_id] = datasource
    logger.info(f"Updated datasource {datasource_id} status to {status_update.status}")
    
    return datasource


@router.post("/status-update", response_model=dict)
async def receive_status_update(request: StatusUpdateRequest) -> dict:
    """Receive status updates from external processing system.
    
    This endpoint is called by external systems (like n8n) to update
    the status of a datasource after processing.
    """
    if request.source_id not in datasources_db:
        logger.warning(f"Status update received for unknown datasource: {request.source_id}")
        raise HTTPException(status_code=404, detail="Data source not found")
    
    datasource = datasources_db[request.source_id]
    
    # Update status
    datasource.status = request.status
    datasource.updated_at = datetime.utcnow()
    
    # Update last success/error timestamps
    if request.status == DataSourceStatus.ACTIVE:
        datasource.last_success = datetime.utcnow()
    elif request.status == DataSourceStatus.ERROR:
        datasource.last_error = request.error_message or "Unknown error"
        datasource.error_count += 1
    
    # Update counts
    if request.observations_processed:
        datasource.success_count += request.observations_processed
    if request.observations_failed:
        datasource.error_count += request.observations_failed
    
    datasources_db[request.source_id] = datasource
    logger.info(
        f"Status update for datasource {request.source_id}: "
        f"status={request.status}, processed={request.observations_processed}, "
        f"failed={request.observations_failed}"
    )
    
    return {
        "status": "updated",
        "datasource_id": request.source_id,
        "new_status": request.status.value
    }
