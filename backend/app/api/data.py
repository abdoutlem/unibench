"""Data query and comparison API endpoints."""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.models.unified_data import FactMetric, ComparisonQuery, ComparisonResult
from app.models.glossary import MetricDomain
from app.services.data_storage import get_data_storage

logger = logging.getLogger(__name__)

router = APIRouter()
data_storage = get_data_storage()


@router.get("/facts", response_model=List[FactMetric])
async def query_facts(
    metric_ids: Optional[str] = Query(None, description="Comma-separated metric IDs"),
    entity_ids: Optional[str] = Query(None, description="Comma-separated entity IDs"),
    domain: Optional[MetricDomain] = Query(None, description="Filter by domain"),
    fiscal_years: Optional[str] = Query(None, description="Comma-separated fiscal years"),
    fiscal_year_start: Optional[int] = Query(None, description="Start fiscal year"),
    fiscal_year_end: Optional[int] = Query(None, description="End fiscal year"),
    include_pending: bool = Query(False, description="Include pending review values"),
    limit: Optional[int] = Query(100, ge=1, le=1000, description="Maximum results")
):
    """Query extracted facts with filters."""
    try:
        metric_id_list = [m.strip() for m in metric_ids.split(",")] if metric_ids else None
        entity_id_list = [e.strip() for e in entity_ids.split(",")] if entity_ids else None
        fiscal_year_list = [int(y.strip()) for y in fiscal_years.split(",")] if fiscal_years else None
        
        facts = data_storage.query_facts(
            metric_ids=metric_id_list,
            entity_ids=entity_id_list,
            domain=domain,
            fiscal_years=fiscal_year_list,
            fiscal_year_start=fiscal_year_start,
            fiscal_year_end=fiscal_year_end,
            include_pending=include_pending,
            limit=limit
        )
        
        return facts
    except Exception as e:
        logger.error(f"Error querying facts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare", response_model=List[ComparisonResult])
async def compare_metrics(
    metric_ids: str = Query(..., description="Comma-separated metric IDs"),
    entity_ids: Optional[str] = Query(None, description="Comma-separated entity IDs"),
    fiscal_years: Optional[str] = Query(None, description="Comma-separated fiscal years"),
    group_by: Optional[str] = Query(None, description="Comma-separated dimensions to group by")
):
    """Compare metrics across institutions and time."""
    try:
        metric_id_list = [m.strip() for m in metric_ids.split(",")]
        entity_id_list = [e.strip() for e in entity_ids.split(",")] if entity_ids else None
        fiscal_year_list = [int(y.strip()) for y in fiscal_years.split(",")] if fiscal_years else None
        group_by_list = [g.strip() for g in group_by.split(",")] if group_by else None
        
        results = data_storage.compare_metrics(
            metric_ids=metric_id_list,
            entity_ids=entity_id_list,
            fiscal_years=fiscal_year_list,
            group_by=group_by_list
        )
        
        return results
    except Exception as e:
        logger.error(f"Error comparing metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timeseries", response_model=List[FactMetric])
async def get_timeseries(
    metric_id: str = Query(..., description="Metric ID"),
    entity_id: Optional[str] = Query(None, description="Entity ID"),
    fiscal_year_start: Optional[int] = Query(None, description="Start fiscal year"),
    fiscal_year_end: Optional[int] = Query(None, description="End fiscal year")
):
    """Get time series data for a metric."""
    try:
        facts = data_storage.get_timeseries(
            metric_id=metric_id,
            entity_id=entity_id,
            fiscal_year_start=fiscal_year_start,
            fiscal_year_end=fiscal_year_end
        )
        return facts
    except Exception as e:
        logger.error(f"Error getting timeseries: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/aggregate", response_model=List[ComparisonResult])
async def aggregate_metrics(
    metric_ids: str = Query(..., description="Comma-separated metric IDs"),
    group_by: str = Query(..., description="Comma-separated dimensions to group by"),
    entity_ids: Optional[str] = Query(None, description="Comma-separated entity IDs"),
    fiscal_years: Optional[str] = Query(None, description="Comma-separated fiscal years")
):
    """Aggregate metrics by dimensions."""
    try:
        metric_id_list = [m.strip() for m in metric_ids.split(",")]
        group_by_list = [g.strip() for g in group_by.split(",")]
        entity_id_list = [e.strip() for e in entity_ids.split(",")] if entity_ids else None
        fiscal_year_list = [int(y.strip()) for y in fiscal_years.split(",")] if fiscal_years else None
        
        results = data_storage.compare_metrics(
            metric_ids=metric_id_list,
            entity_ids=entity_id_list,
            fiscal_years=fiscal_year_list,
            group_by=group_by_list
        )
        
        return results
    except Exception as e:
        logger.error(f"Error aggregating metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains/{domain}", response_model=List[FactMetric])
async def get_facts_by_domain(domain: MetricDomain):
    """Get all facts for a specific domain."""
    try:
        facts = data_storage.get_metrics_by_domain(domain)
        return facts
    except Exception as e:
        logger.error(f"Error getting facts for domain {domain}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
