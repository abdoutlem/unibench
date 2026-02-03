"""Data exploration API endpoints."""

import logging
import uuid
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from app.db.database import get_db_session, init_db
from app.db.models import (
    MetricDefinition as DBMetricDefinition,
    MetricAlias as DBMetricAlias,
    ValueType,
    AggregationType
)
from app.services.metric_discovery import MetricDiscoveryService
from app.services.glossary_loader_db import get_glossary_loader_db
from app.models.glossary import MetricDomain

logger = logging.getLogger(__name__)

router = APIRouter()
discovery_service = MetricDiscoveryService()
glossary_loader = get_glossary_loader_db()


class MetricGroup(BaseModel):
    """A semantically grouped set of metrics."""
    group_id: str
    canonical_name: str
    description: str
    unit: str
    category: str
    confidence: float
    metrics: List[dict]
    total_observations: int
    raw_metric_names: List[str] = []  # List of raw metric names in this group


class AcceptMetricGroupRequest(BaseModel):
    """Request to accept a metric group and add to glossary."""
    group_id: str
    canonical_name: str
    description: str
    unit: str
    category: str
    domain: Optional[str] = None  # Will be derived from category if not provided


@router.get("/discovered-metrics", response_model=List[MetricGroup])
async def get_discovered_metrics():
    """Get discovered metrics grouped semantically."""
    try:
        init_db()
        
        # Get discovered metrics
        discovered = discovery_service.get_discovered_metrics()
        
        if not discovered:
            return []
        
        # Group semantically
        groups = discovery_service.group_metrics_semantically(discovered)
        
        return groups
    except Exception as e:
        logger.error(f"Error getting discovered metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/accept-metric-group", response_model=dict)
async def accept_metric_group(request: AcceptMetricGroupRequest = Body(...)):
    """Accept a metric group and add it to the glossary."""
    try:
        init_db()
        db = get_db_session()
        
        try:
            # Determine domain from category
            domain_map = {
                "finance": MetricDomain.FINANCE,
                "students": MetricDomain.STUDENTS,
                "faculty": MetricDomain.FACULTY,
                "research": MetricDomain.RESEARCH,
                "operations": MetricDomain.OPERATIONS,
                "administrative_staff": MetricDomain.ADMINISTRATIVE_STAFF,
            }
            domain = domain_map.get(request.category.lower(), MetricDomain.OPERATIONS)
            if request.domain:
                try:
                    domain = MetricDomain(request.domain)
                except:
                    pass
            
            # Generate metric ID
            metric_id = f"metric-{request.canonical_name.lower().replace(' ', '-').replace('_', '-')}"
            # Ensure unique
            existing = db.query(DBMetricDefinition).filter(
                DBMetricDefinition.metric_id == metric_id
            ).first()
            if existing:
                metric_id = f"{metric_id}-{uuid.uuid4().hex[:8]}"
            
            # Determine value type from unit
            value_type = ValueType.NUMBER
            if "percentage" in request.unit.lower() or "%" in request.unit:
                value_type = ValueType.PERCENTAGE
            elif "count" in request.unit.lower() or request.unit.lower() in ["integer", "int"]:
                value_type = ValueType.INTEGER
            
            # Create metric definition
            new_metric = DBMetricDefinition(
                metric_id=metric_id,
                canonical_name=request.canonical_name,
                description=request.description,
                unit=request.unit,
                value_type=value_type,
                default_aggregation=AggregationType.SUM,
                category=domain.value,
                calculation_logic="",  # User can fill this later
                data_owner="data-exploration",
                source="n8n-webhook",
                update_frequency="as-needed",
                version="1.0",
                effective_date=date.today(),
                is_active=1,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_metric)
            
            # Get the original metrics from the group to create aliases
            # We'll need to get this from the discovery service
            discovered = discovery_service.get_discovered_metrics()
            groups = discovery_service.group_metrics_semantically(discovered)
            
            group = next((g for g in groups if g["group_id"] == request.group_id), None)
            
            raw_metric_names = []
            if group:
                # Extract raw metric names from the group
                for metric in group.get("metrics", []):
                    raw_name = metric.get("raw_metric_name")
                    if raw_name:
                        raw_metric_names.append(raw_name)
                        
                        # Create alias for this raw metric name
                        alias = DBMetricAlias(
                            alias_id=str(uuid.uuid4()),
                            metric_id=metric_id,
                            source_system="n8n",
                            source_metric_name=raw_name,
                            confidence=0.9,
                            created_at=datetime.utcnow()
                        )
                        db.add(alias)
            
            # Migrate all unmapped observations for these raw metric names
            from app.db.models import (
                UnmappedObservation as DBUnmappedObservation,
                MetricObservation as DBMetricObservation,
                ObservationDimension as DBObservationDimension,
                Dimension as DBDimension,
                DimensionType
            )
            
            migrated_count = 0
            for raw_name in raw_metric_names:
                unmapped_obs = db.query(DBUnmappedObservation).filter(
                    DBUnmappedObservation.raw_metric_name == raw_name
                ).all()
                
                for unmapped in unmapped_obs:
                    # Create regular observation
                    observation = DBMetricObservation(
                        observation_id=str(uuid.uuid4()),
                        metric_id=metric_id,
                        entity_id=unmapped.entity_id,
                        observation_date=unmapped.observation_date,
                        value=float(unmapped.value),
                        unit=request.unit,
                        source_document_id=unmapped.source_document_id,
                        confidence=0.9,
                        created_at=unmapped.created_at
                    )
                    db.add(observation)
                    db.flush()
                    
                    # Migrate dimensions
                    if unmapped.dimensions:
                        for dim_key, dim_value in unmapped.dimensions.items():
                            # Find or create dimension
                            db_dim = db.query(DBDimension).filter(
                                DBDimension.dimension_name == dim_key
                            ).first()
                            
                            if not db_dim:
                                db_dim = DBDimension(
                                    dimension_id=str(uuid.uuid4()),
                                    dimension_name=dim_key,
                                    dimension_type=DimensionType.CATEGORICAL,
                                    description=f"Dimension for {dim_key}",
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
                    
                    # Delete unmapped observation
                    db.delete(unmapped)
                    migrated_count += 1
            
            db.commit()
            
            # Reload glossary
            glossary_loader.reload()
            
            logger.info(f"Accepted metric group '{request.group_id}' as '{metric_id}', migrated {migrated_count} observations")
            
            return {
                "status": "accepted",
                "metric_id": metric_id,
                "canonical_name": request.canonical_name,
                "migrated_observations": migrated_count
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error accepting metric group: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reject-metric-group/{group_id}")
async def reject_metric_group(group_id: str):
    """Reject a metric group (mark for exclusion)."""
    # For now, this just returns success
    # In the future, we could store rejected groups to avoid showing them again
    return {"status": "rejected", "group_id": group_id}
