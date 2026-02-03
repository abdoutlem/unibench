"""Glossary API endpoints."""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Body
from app.models.glossary import GlossaryMetric, MetricDomain, GlossaryMatch, DimensionDefinition
from pydantic import BaseModel
from app.services.glossary_loader import get_glossary_loader
from app.services.glossary_loader_db import get_glossary_loader_db
from app.services.glossary_matcher import GlossaryMatcher

logger = logging.getLogger(__name__)

router = APIRouter()

# Lazy initialization – resolved on first request instead of at import time.
# This avoids issues when the DB isn't ready during module loading.
_glossary_loader = None
_glossary_matcher = None


def _get_loader():
    global _glossary_loader, _glossary_matcher
    if _glossary_loader is None:
        try:
            _glossary_loader = get_glossary_loader_db()
        except Exception:
            _glossary_loader = get_glossary_loader()
        _glossary_matcher = GlossaryMatcher(_glossary_loader)
    return _glossary_loader


def _get_matcher():
    _get_loader()
    return _glossary_matcher


@router.get("/metrics", response_model=List[GlossaryMetric])
async def list_metrics(
    domain: Optional[MetricDomain] = Query(None, description="Filter by domain"),
    search: Optional[str] = Query(None, description="Search in names and descriptions")
):
    """List all glossary metrics, optionally filtered by domain or search query."""
    try:
        loader = _get_loader()
        loader.load_all()

        if search:
            metrics = loader.search_metrics(search, domain)
        elif domain:
            metrics = loader.get_metrics_by_domain(domain)
        else:
            metrics = loader.get_all_metrics()

        return metrics
    except Exception as e:
        logger.error(f"Error listing metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{metric_id}", response_model=GlossaryMetric)
async def get_metric(metric_id: str):
    """Get a specific metric definition by ID."""
    try:
        loader = _get_loader()
        loader.load_all()
        metric = loader.get_metric(metric_id)
        if not metric:
            raise HTTPException(status_code=404, detail=f"Metric '{metric_id}' not found")
        return metric
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting metric {metric_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/domain/{domain}", response_model=List[GlossaryMetric])
async def get_metrics_by_domain(domain: MetricDomain):
    """Get all metrics for a specific domain."""
    try:
        loader = _get_loader()
        loader.load_all()
        metrics = loader.get_metrics_by_domain(domain)
        return metrics
    except Exception as e:
        logger.error(f"Error getting metrics for domain {domain}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/match", response_model=List[GlossaryMatch])
async def match_text(
    text: str = Query(..., description="Text to match against glossary"),
    domain: Optional[MetricDomain] = Query(None, description="Limit search to specific domain"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of matches to return")
):
    """Match text to glossary entries and return potential metric matches."""
    try:
        loader = _get_loader()
        loader.load_all()
        matches = _get_matcher().match_text(text, domain=domain, limit=limit)
        return matches
    except Exception as e:
        logger.error(f"Error matching text: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/variations/{metric_id}", response_model=List[str])
async def get_variations(metric_id: str):
    """Get semantic variations for a specific metric."""
    try:
        loader = _get_loader()
        loader.load_all()
        metric = loader.get_metric(metric_id)
        if not metric:
            raise HTTPException(status_code=404, detail=f"Metric '{metric_id}' not found")
        return metric.semantic_variations
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting variations for {metric_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics", response_model=GlossaryMetric)
async def create_metric(metric: GlossaryMetric = Body(...)):
    """Create or update a metric in the glossary."""
    try:
        loader = _get_loader()
        loader.load_all()

        success = loader.save_metric(metric)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save metric to glossary")

        loader.reload()
        _get_matcher().reload()

        logger.info(f"Metric created/updated: {metric.id} ({metric.canonical_name})")

        return metric
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating metric: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/metrics/{metric_id}", response_model=GlossaryMetric)
async def update_metric(metric_id: str, metric: GlossaryMetric = Body(...)):
    """Update an existing metric."""
    try:
        if metric_id != metric.id:
            raise HTTPException(status_code=400, detail="Metric ID in path must match metric ID in body")
        
        loader = _get_loader()
        loader.load_all()

        existing = loader.get_metric(metric_id)
        if not existing:
            raise HTTPException(status_code=404, detail=f"Metric '{metric_id}' not found")

        if not metric.created_at and existing.created_at:
            metric.created_at = existing.created_at

        success = loader.save_metric(metric)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update metric in glossary")

        loader.reload()
        _get_matcher().reload()
        
        logger.info(f"Metric updated: {metric_id} ({metric.canonical_name})")
        
        return metric
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating metric: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/metrics/{metric_id}")
async def delete_metric(metric_id: str):
    """Delete a metric from the glossary (marks as inactive)."""
    try:
        loader = _get_loader()
        loader.load_all()
        metric = loader.get_metric(metric_id)
        if not metric:
            raise HTTPException(status_code=404, detail=f"Metric '{metric_id}' not found")

        metric.is_active = False
        success = loader.save_metric(metric)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update metric")

        loader.reload()
        _get_matcher().reload()
        
        logger.info(f"Metric deactivated: {metric_id}")
        
        return {"status": "deleted", "metric_id": metric_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting metric: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimensions", response_model=List[DimensionDefinition])
async def list_dimensions():
    """List all available dimensions."""
    try:
        loader = _get_loader()
        loader.load_all()
        dimensions = loader.get_all_dimensions()
        return dimensions
    except Exception as e:
        logger.error(f"Error listing dimensions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimensions/{dimension_id}", response_model=DimensionDefinition)
async def get_dimension(dimension_id: str):
    """Get a specific dimension definition by ID."""
    try:
        loader = _get_loader()
        loader.load_all()
        dimension = loader.get_dimension(dimension_id)
        if not dimension:
            raise HTTPException(status_code=404, detail=f"Dimension '{dimension_id}' not found")
        return dimension
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dimension {dimension_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/dimensions/{dimension_id}", response_model=DimensionDefinition)
async def update_dimension(dimension_id: str, dimension: DimensionDefinition = Body(...)):
    """Update an existing dimension definition."""
    try:
        if dimension_id != dimension.id:
            raise HTTPException(status_code=400, detail="Dimension ID in path must match dimension ID in body")
        
        loader = _get_loader()
        loader.load_all()

        existing = loader.get_dimension(dimension_id)
        if not existing:
            raise HTTPException(status_code=404, detail=f"Dimension '{dimension_id}' not found")

        success = loader.save_dimension(dimension)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update dimension in glossary")

        loader.reload()
        
        logger.info(f"Dimension updated: {dimension_id} ({dimension.name})")
        
        return dimension
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dimension: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
