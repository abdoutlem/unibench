"""Webhook API endpoints for n8n integration."""

import logging
import uuid
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Body, Query
from sqlalchemy.orm import Session

from app.models.webhook import (
    N8NWebhookPayload, 
    MetricMappingConfig, 
    WebhookProcessingResult,
    N8NObservation
)
from app.db.database import get_db_session, init_db
from app.db.models import (
    MetricMappingConfig as DBMetricMappingConfig,
    MetricObservation as DBMetricObservation,
    ObservationDimension as DBObservationDimension,
    Entity as DBEntity,
    SourceDocument as DBSourceDocument,
    Dimension as DBDimension,
    UnmappedObservation as DBUnmappedObservation,
    SourceType
)
from app.services.webhook_processor import WebhookProcessor
from app.models.glossary import MetricDomain

logger = logging.getLogger(__name__)

router = APIRouter()
processor = WebhookProcessor()


@router.post("/n8n", response_model=WebhookProcessingResult)
async def process_n8n_webhook(payload: N8NWebhookPayload = Body(...)):
    """Process n8n webhook payload and save observations to database."""
    try:
        init_db()  # Ensure database is initialized
        
        db = get_db_session()
        success_count = 0
        error_count = 0
        errors = []
        created_metrics = []
        observation_ids = []
        
        # Use provided observation_date or default to today
        observation_date = payload.observation_date or date.today()
        
        # Ensure entity exists
        entity = db.query(DBEntity).filter(
            DBEntity.entity_id == payload.entity_id
        ).first()
        
        if not entity:
            # Create entity automatically
            entity = DBEntity(
                entity_id=payload.entity_id,
                entity_type="Institution",  # Default type
                entity_name=payload.entity_id,
                created_at=datetime.utcnow()
            )
            db.add(entity)
            db.flush()
            logger.info(f"Auto-created entity: {payload.entity_id}")
        
        # Create source document if URL provided
        source_doc_id = None
        if payload.source_url:
            source_doc = DBSourceDocument(
                source_document_id=str(uuid.uuid4()),
                source_type=SourceType.WEB,
                source_name=payload.source_name or "n8n-webhook",
                source_url=payload.source_url,
                extracted_at=datetime.utcnow()
            )
            db.add(source_doc)
            db.flush()
            source_doc_id = source_doc.source_document_id
        
        # Process each observation
        for obs in payload.data:
            try:
                # Map raw metric name to canonical metric_id with full context
                context = {
                    "dimensions": obs.dimensions,
                    "aggregation": obs.aggregation,
                    "value": obs.value,
                    "entity_id": payload.entity_id,
                    "source_url": payload.source_url,
                    "source_name": payload.source_name
                }
                metric_id = processor.map_metric_name(obs.raw_metric_name, context=context)
                
                if metric_id:
                    # Metric exists in glossary - save as regular observation
                    glossary_metric = processor.glossary_loader.get_metric(metric_id)
                    domain = glossary_metric.domain if glossary_metric else MetricDomain.OPERATIONS
                    unit = glossary_metric.unit if glossary_metric else "number"
                    
                    # Validate dimensions
                    validated_dimensions = processor.validate_dimensions(
                        obs.dimensions,
                        metric_id
                    )
                    
                    # Create observation
                    observation = DBMetricObservation(
                        observation_id=str(uuid.uuid4()),
                        metric_id=metric_id,
                        entity_id=payload.entity_id,
                        observation_date=observation_date,
                        value=float(obs.value),
                        unit=unit,
                        source_document_id=source_doc_id,
                        confidence=0.9,
                        created_at=datetime.utcnow()
                    )
                    db.add(observation)
                    db.flush()
                    observation_ids.append(observation.observation_id)
                    
                    # Create observation dimensions
                    for dim_key, dim_value in validated_dimensions.items():
                        # Find or create dimension
                        db_dim = db.query(DBDimension).filter(
                            DBDimension.dimension_name == dim_key
                        ).first()
                        
                        if not db_dim:
                            from app.db.models import DimensionType
                            db_dim = DBDimension(
                                dimension_id=str(uuid.uuid4()),
                                dimension_name=dim_key,
                                dimension_type=DimensionType.CATEGORICAL,
                                description=f"Auto-created dimension for {dim_key}",
                                authorized_values=None
                            )
                            db.add(db_dim)
                            db.flush()
                        
                        obs_dim = DBObservationDimension(
                            observation_id=observation.observation_id,
                            dimension_id=db_dim.dimension_id,
                            dimension_value=str(dim_value)
                        )
                        db.add(obs_dim)
                    
                    success_count += 1
                    logger.info(f"Processed observation: {obs.raw_metric_name} = {obs.value}")
                else:
                    # Metric NOT in glossary - save as unmapped observation for review
                    unmapped = DBUnmappedObservation(
                        observation_id=str(uuid.uuid4()),
                        raw_metric_name=obs.raw_metric_name,
                        entity_id=payload.entity_id,
                        observation_date=observation_date,
                        value=float(obs.value),
                        unit=None,  # Will be determined when metric is accepted
                        dimensions=obs.dimensions,  # Store as JSON
                        aggregation=obs.aggregation,
                        source_document_id=source_doc_id,
                        source_url=payload.source_url,
                        source_name=payload.source_name,
                        created_at=datetime.utcnow()
                    )
                    db.add(unmapped)
                    db.flush()
                    observation_ids.append(unmapped.observation_id)
                    success_count += 1
                    logger.info(f"Saved unmapped observation for '{obs.raw_metric_name}' - will appear in Data Exploration")
                
            except Exception as e:
                error_count += 1
                error_msg = str(e)
                errors.append({
                    "raw_metric_name": obs.raw_metric_name,
                    "value": obs.value,
                    "error": error_msg
                })
                logger.error(f"Error processing observation {obs.raw_metric_name}: {e}", exc_info=True)
        
        # Commit all successful observations
        if success_count > 0:
            db.commit()
        else:
            db.rollback()
        
        return WebhookProcessingResult(
            success_count=success_count,
            error_count=error_count,
            total_count=len(payload.data),
            errors=errors,
            created_metrics=created_metrics,
            observation_ids=observation_ids
        )
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        if 'db' in locals():
            db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")
    finally:
        if 'db' in locals():
            db.close()


@router.get("/mappings", response_model=List[MetricMappingConfig])
async def list_metric_mappings():
    """List all metric mapping configurations."""
    try:
        init_db()
        db = get_db_session()
        try:
            mappings = db.query(DBMetricMappingConfig).all()
            return [
                MetricMappingConfig(
                    config_id=m.config_id,
                    raw_metric_name=m.raw_metric_name,
                    metric_id=m.metric_id,
                    confidence=float(m.confidence) if m.confidence else 1.0,
                    created_at=m.created_at,
                    updated_at=m.updated_at
                )
                for m in mappings
            ]
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error listing mappings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mappings", response_model=MetricMappingConfig)
async def create_metric_mapping(config: MetricMappingConfig = Body(...)):
    """Create a new metric mapping configuration."""
    try:
        init_db()
        db = get_db_session()
        try:
            # Check if mapping already exists
            existing = db.query(DBMetricMappingConfig).filter(
                DBMetricMappingConfig.raw_metric_name == config.raw_metric_name
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Mapping for '{config.raw_metric_name}' already exists"
                )
            
            # Verify metric exists
            from app.db.models import MetricDefinition as DBMetricDefinition
            metric = db.query(DBMetricDefinition).filter(
                DBMetricDefinition.metric_id == config.metric_id
            ).first()
            
            if not metric:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metric '{config.metric_id}' not found"
                )
            
            # Create mapping
            db_mapping = DBMetricMappingConfig(
                config_id=config.config_id or str(uuid.uuid4()),
                raw_metric_name=config.raw_metric_name,
                metric_id=config.metric_id,
                confidence=config.confidence,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(db_mapping)
            db.commit()
            
            return MetricMappingConfig(
                config_id=db_mapping.config_id,
                raw_metric_name=db_mapping.raw_metric_name,
                metric_id=db_mapping.metric_id,
                confidence=float(db_mapping.confidence),
                created_at=db_mapping.created_at,
                updated_at=db_mapping.updated_at
            )
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mappings/{config_id}", response_model=MetricMappingConfig)
async def update_metric_mapping(
    config_id: str,
    config: MetricMappingConfig = Body(...)
):
    """Update an existing metric mapping configuration."""
    try:
        init_db()
        db = get_db_session()
        try:
            mapping = db.query(DBMetricMappingConfig).filter(
                DBMetricMappingConfig.config_id == config_id
            ).first()
            
            if not mapping:
                raise HTTPException(status_code=404, detail=f"Mapping '{config_id}' not found")
            
            # Verify metric exists if changed
            if config.metric_id != mapping.metric_id:
                from app.db.models import MetricDefinition as DBMetricDefinition
                metric = db.query(DBMetricDefinition).filter(
                    DBMetricDefinition.metric_id == config.metric_id
                ).first()
                
                if not metric:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Metric '{config.metric_id}' not found"
                    )
            
            # Update mapping
            mapping.metric_id = config.metric_id
            mapping.confidence = config.confidence
            mapping.updated_at = datetime.utcnow()
            
            db.commit()
            
            return MetricMappingConfig(
                config_id=mapping.config_id,
                raw_metric_name=mapping.raw_metric_name,
                metric_id=mapping.metric_id,
                confidence=float(mapping.confidence),
                created_at=mapping.created_at,
                updated_at=mapping.updated_at
            )
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/mappings/{config_id}")
async def delete_metric_mapping(config_id: str):
    """Delete a metric mapping configuration."""
    try:
        init_db()
        db = get_db_session()
        try:
            mapping = db.query(DBMetricMappingConfig).filter(
                DBMetricMappingConfig.config_id == config_id
            ).first()
            
            if not mapping:
                raise HTTPException(status_code=404, detail=f"Mapping '{config_id}' not found")
            
            db.delete(mapping)
            db.commit()
            
            return {"status": "deleted", "config_id": config_id}
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
