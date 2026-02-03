"""Analytics explore API endpoints."""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float, extract, case, and_
from datetime import date

from app.db.database import get_db
from app.db.models import (
    MetricObservation, MetricDefinition, Entity,
    Dimension, ObservationDimension,
)
from app.models.analytics import (
    ExploreRequest, ExploreResponse, ColumnDef, EntityListItem,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/explore", response_model=ExploreResponse)
async def explore_metrics(request: ExploreRequest, db: Session = Depends(get_db)):
    """Execute an analytics explore query with grouping and aggregation."""
    try:
        is_no_agg = request.aggregation == "none"

        # Start building the query
        select_columns = []
        group_by_columns = []
        columns_def: List[ColumnDef] = []

        # Always join metric_definitions for the metric name
        base_query = (
            db.query()
            .select_from(MetricObservation)
            .join(MetricDefinition, MetricObservation.metric_id == MetricDefinition.metric_id)
            .join(Entity, MetricObservation.entity_id == Entity.entity_id)
        )

        # Handle group_by dimensions
        for dim in request.group_by:
            if dim == "entity_id":
                col = Entity.entity_name
                select_columns.append(col.label("entity_name"))
                group_by_columns.append(col)
                columns_def.append(ColumnDef(name="entity_name", type="string"))
            elif dim == "fiscal_year":
                col = extract("year", MetricObservation.observation_date)
                select_columns.append(col.label("fiscal_year"))
                group_by_columns.append(col)
                columns_def.append(ColumnDef(name="fiscal_year", type="number"))
            elif dim == "metric_id":
                col = MetricDefinition.canonical_name
                select_columns.append(col.label("metric_name"))
                group_by_columns.append(col)
                select_columns.append(MetricDefinition.metric_id.label("metric_id"))
                group_by_columns.append(MetricDefinition.metric_id)
                columns_def.append(ColumnDef(name="metric_name", type="string"))
                columns_def.append(ColumnDef(name="metric_id", type="string"))
            else:
                # It's a dimension from the observation_dimensions table
                dim_alias = db.query(Dimension).filter(Dimension.dimension_name == dim).first()
                if dim_alias:
                    od_alias = ObservationDimension
                    base_query = base_query.outerjoin(
                        od_alias,
                        (MetricObservation.observation_id == od_alias.observation_id) &
                        (od_alias.dimension_id == dim_alias.dimension_id)
                    )
                    select_columns.append(od_alias.dimension_value.label(dim))
                    group_by_columns.append(od_alias.dimension_value)
                    columns_def.append(ColumnDef(name=dim, type="string"))

        # Bug fix: handle aggregation "none" – return raw values without agg function
        if is_no_agg:
            select_columns.append(cast(MetricObservation.value, Float).label("value"))
            columns_def.append(ColumnDef(name="value", type="number"))
            # Add observation_date for context
            select_columns.append(MetricObservation.observation_date.label("observation_date"))
            columns_def.append(ColumnDef(name="observation_date", type="date"))
        else:
            agg_func = _get_agg_func(request.aggregation)
            value_col = agg_func(cast(MetricObservation.value, Float)).label("value")
            select_columns.append(value_col)
            columns_def.append(ColumnDef(name="value", type="number"))

        # Bug fix: add unit to GROUP BY so it doesn't cause SQL errors
        select_columns.append(MetricDefinition.unit.label("unit"))
        group_by_columns.append(MetricDefinition.unit)
        columns_def.append(ColumnDef(name="unit", type="string"))

        # Build query with select columns
        query = base_query.with_entities(*select_columns)

        # Apply filters
        query = query.filter(MetricObservation.metric_id.in_(request.metric_ids))

        if request.filters.entity_ids:
            query = query.filter(MetricObservation.entity_id.in_(request.filters.entity_ids))

        if request.filters.fiscal_year_start:
            query = query.filter(
                extract("year", MetricObservation.observation_date) >= request.filters.fiscal_year_start
            )
        if request.filters.fiscal_year_end:
            query = query.filter(
                extract("year", MetricObservation.observation_date) <= request.filters.fiscal_year_end
            )

        # Bug fix: apply dimension_filters (was ignored before)
        if request.filters.dimension_filters:
            for dim_name, allowed_values in request.filters.dimension_filters.items():
                if not allowed_values:
                    continue
                dim_row = db.query(Dimension).filter(Dimension.dimension_name == dim_name).first()
                if dim_row:
                    query = query.filter(
                        MetricObservation.observation_id.in_(
                            db.query(ObservationDimension.observation_id).filter(
                                and_(
                                    ObservationDimension.dimension_id == dim_row.dimension_id,
                                    ObservationDimension.dimension_value.in_(allowed_values),
                                )
                            )
                        )
                    )

        # Apply GROUP BY (skip for aggregation "none")
        if group_by_columns and not is_no_agg:
            query = query.group_by(*group_by_columns)

        # Apply sorting
        if not is_no_agg and request.sort_by == "value":
            value_col_ref = [c for c in select_columns if getattr(c, 'key', None) == 'value' or getattr(c, 'name', None) == 'value']
            if value_col_ref:
                if request.sort_order == "asc":
                    query = query.order_by(value_col_ref[0].asc())
                else:
                    query = query.order_by(value_col_ref[0].desc())

        # Apply limit and execute
        query = query.limit(request.limit)
        results = query.all()

        # Bug fix: count from actual results (query.count() is unreliable after GROUP BY)
        total_rows = len(results)

        # Format rows
        rows = []
        for row in results:
            row_dict = {}
            for col_def in columns_def:
                val = getattr(row, col_def.name, None)
                if val is not None:
                    if col_def.type == "number":
                        row_dict[col_def.name] = float(val)
                    elif col_def.type == "date":
                        row_dict[col_def.name] = str(val)
                    else:
                        row_dict[col_def.name] = str(val)
                else:
                    row_dict[col_def.name] = None
            rows.append(row_dict)

        return ExploreResponse(
            columns=columns_def,
            rows=rows,
            total_rows=total_rows,
            metadata={
                "aggregation": request.aggregation,
                "metric_ids": request.metric_ids,
                "group_by": request.group_by,
            }
        )

    except Exception as e:
        logger.error(f"Error in explore query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entities", response_model=List[EntityListItem])
async def list_entities(db: Session = Depends(get_db)):
    """List all entities (institutions)."""
    try:
        entities = db.query(Entity).order_by(Entity.entity_name).all()
        return [
            EntityListItem(
                entity_id=e.entity_id,
                entity_name=e.entity_name,
                entity_type=e.entity_type,
            )
            for e in entities
        ]
    except Exception as e:
        logger.error(f"Error listing entities: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimension-values")
async def get_dimension_values(
    dimension_name: str = Query(..., description="Dimension name to get values for"),
    db: Session = Depends(get_db),
):
    """Get distinct values for a given dimension."""
    try:
        dimension = db.query(Dimension).filter(Dimension.dimension_name == dimension_name).first()
        if not dimension:
            raise HTTPException(status_code=404, detail=f"Dimension '{dimension_name}' not found")

        values = (
            db.query(ObservationDimension.dimension_value)
            .filter(ObservationDimension.dimension_id == dimension.dimension_id)
            .distinct()
            .order_by(ObservationDimension.dimension_value)
            .all()
        )
        return [v[0] for v in values]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dimension values: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _get_agg_func(aggregation: str):
    """Return the SQLAlchemy aggregation function."""
    mapping = {
        "sum": func.sum,
        "average": func.avg,
        "avg": func.avg,
        "min": func.min,
        "max": func.max,
        "count": func.count,
        "latest": func.max,  # latest = max observation_date value
        "median": func.avg,  # SQLite doesn't have median; fallback to avg
    }
    return mapping.get(aggregation, func.sum)
