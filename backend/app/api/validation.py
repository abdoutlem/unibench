"""Cross-validation API endpoints for verifying analytics query results."""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text, func, cast, Float, extract, and_
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.db.models import (
    MetricObservation, MetricDefinition, Entity,
    Dimension, ObservationDimension, SourceDocument,
)
from app.models.analytics import ExploreRequest, ExploreResponse
from app.api.analytics import explore_metrics

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Response models ─────────────────────────────────────────────────────────

class ValidationResult(BaseModel):
    analytics_result: ExploreResponse
    raw_query_result: List[Dict[str, Any]]
    match: bool
    discrepancies: List[Dict[str, Any]] = Field(default_factory=list)
    raw_sql: str


class IntegrityCheck(BaseModel):
    orphan_observations: int = Field(description="Observations referencing non-existent metrics or entities")
    invalid_percentages: int = Field(description="Percentage metrics outside 0-100")
    negative_counts: int = Field(description="Count/currency metrics with negative values")
    total_entities: int
    total_metrics: int
    total_observations: int
    coverage: List[Dict[str, Any]] = Field(description="Entity/metric/year coverage summary")


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/verify", response_model=ValidationResult)
async def verify_explore_result(request: ExploreRequest, db: Session = Depends(get_db)):
    """Run the analytics explore query AND an independent raw SQL query, then compare."""
    try:
        # 1. Execute via the analytics explore path
        analytics_resp = await explore_metrics(request, db)

        # 2. Build independent raw SQL
        raw_sql, raw_rows = _execute_raw_query(request, db)

        # 3. Compare
        match, discrepancies = _compare_results(analytics_resp.rows, raw_rows)

        return ValidationResult(
            analytics_result=analytics_resp,
            raw_query_result=raw_rows,
            match=match,
            discrepancies=discrepancies,
            raw_sql=raw_sql,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validation verify error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/integrity", response_model=IntegrityCheck)
async def check_data_integrity(db: Session = Depends(get_db)):
    """Check FK integrity, data ranges, and coverage."""
    try:
        # Orphan observations (metric_id not in metric_definitions)
        orphan_metric = db.execute(text(
            "SELECT COUNT(*) FROM metric_observations "
            "WHERE metric_id NOT IN (SELECT metric_id FROM metric_definitions)"
        )).scalar() or 0

        orphan_entity = db.execute(text(
            "SELECT COUNT(*) FROM metric_observations "
            "WHERE entity_id NOT IN (SELECT entity_id FROM entities)"
        )).scalar() or 0

        # Invalid percentages
        invalid_pct = db.execute(text(
            "SELECT COUNT(*) FROM metric_observations mo "
            "JOIN metric_definitions md ON mo.metric_id = md.metric_id "
            "WHERE md.unit = 'percentage' AND (CAST(mo.value AS REAL) < 0 OR CAST(mo.value AS REAL) > 100)"
        )).scalar() or 0

        # Negative counts/currency
        negative = db.execute(text(
            "SELECT COUNT(*) FROM metric_observations mo "
            "JOIN metric_definitions md ON mo.metric_id = md.metric_id "
            "WHERE md.unit IN ('count', 'currency') AND CAST(mo.value AS REAL) < 0"
        )).scalar() or 0

        total_entities = db.query(Entity).count()
        total_metrics = db.query(MetricDefinition).count()
        total_observations = db.query(MetricObservation).count()

        # Coverage: entity × metric × year combos that have data
        coverage_rows = db.execute(text(
            "SELECT e.entity_name, md.canonical_name AS metric_name, "
            "MIN(CAST(strftime('%Y', mo.observation_date) AS INTEGER)) AS min_year, "
            "MAX(CAST(strftime('%Y', mo.observation_date) AS INTEGER)) AS max_year, "
            "COUNT(*) AS data_points "
            "FROM metric_observations mo "
            "JOIN entities e ON mo.entity_id = e.entity_id "
            "JOIN metric_definitions md ON mo.metric_id = md.metric_id "
            "GROUP BY e.entity_name, md.canonical_name "
            "ORDER BY e.entity_name, md.canonical_name"
        )).fetchall()

        coverage = [
            {
                "entity_name": r[0],
                "metric_name": r[1],
                "min_year": r[2],
                "max_year": r[3],
                "data_points": r[4],
            }
            for r in coverage_rows
        ]

        return IntegrityCheck(
            orphan_observations=orphan_metric + orphan_entity,
            invalid_percentages=invalid_pct,
            negative_counts=negative,
            total_entities=total_entities,
            total_metrics=total_metrics,
            total_observations=total_observations,
            coverage=coverage,
        )

    except Exception as e:
        logger.error(f"Integrity check error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Helpers ─────────────────────────────────────────────────────────────────

def _execute_raw_query(request: ExploreRequest, db: Session) -> tuple[str, list[dict]]:
    """Build and execute a raw SQL version of the explore request."""
    is_no_agg = request.aggregation == "none"

    select_parts = []
    group_parts = []
    joins = []
    wheres = [f"mo.metric_id IN ({_sql_list(request.metric_ids)})"]

    for dim in request.group_by:
        if dim == "entity_id":
            select_parts.append("e.entity_name")
            group_parts.append("e.entity_name")
        elif dim == "fiscal_year":
            select_parts.append("CAST(strftime('%Y', mo.observation_date) AS INTEGER) AS fiscal_year")
            group_parts.append("fiscal_year")
        elif dim == "metric_id":
            select_parts.append("md.canonical_name AS metric_name")
            select_parts.append("md.metric_id")
            group_parts.append("md.canonical_name")
            group_parts.append("md.metric_id")

    if is_no_agg:
        select_parts.append("CAST(mo.value AS REAL) AS value")
    else:
        agg_map = {"sum": "SUM", "average": "AVG", "avg": "AVG", "min": "MIN", "max": "MAX", "count": "COUNT"}
        agg_fn = agg_map.get(request.aggregation, "SUM")
        select_parts.append(f"{agg_fn}(CAST(mo.value AS REAL)) AS value")

    select_parts.append("md.unit")
    group_parts.append("md.unit")

    # Filters
    if request.filters.entity_ids:
        wheres.append(f"mo.entity_id IN ({_sql_list(request.filters.entity_ids)})")
    if request.filters.fiscal_year_start:
        wheres.append(f"CAST(strftime('%Y', mo.observation_date) AS INTEGER) >= {int(request.filters.fiscal_year_start)}")
    if request.filters.fiscal_year_end:
        wheres.append(f"CAST(strftime('%Y', mo.observation_date) AS INTEGER) <= {int(request.filters.fiscal_year_end)}")

    select_clause = ", ".join(select_parts)
    where_clause = " AND ".join(wheres)

    sql = (
        f"SELECT {select_clause} "
        f"FROM metric_observations mo "
        f"JOIN metric_definitions md ON mo.metric_id = md.metric_id "
        f"JOIN entities e ON mo.entity_id = e.entity_id "
        f"WHERE {where_clause}"
    )

    if group_parts and not is_no_agg:
        sql += f" GROUP BY {', '.join(group_parts)}"

    sql += f" LIMIT {int(request.limit)}"

    rows = db.execute(text(sql)).fetchall()
    keys = [p.split(" AS ")[-1].split(".")[-1].strip() for p in select_parts]

    result = []
    for row in rows:
        d = {}
        for i, k in enumerate(keys):
            val = row[i]
            if isinstance(val, (int, float)):
                d[k] = float(val)
            elif val is not None:
                d[k] = str(val)
            else:
                d[k] = None
        result.append(d)

    return sql, result


def _sql_list(values: list[str]) -> str:
    """Turn a list of strings into a SQL IN-clause body."""
    return ", ".join(f"'{v}'" for v in values)


def _compare_results(analytics_rows: list[dict], raw_rows: list[dict]) -> tuple[bool, list[dict]]:
    """Compare two result sets row-by-row. Returns (match, discrepancies)."""
    discrepancies = []

    if len(analytics_rows) != len(raw_rows):
        discrepancies.append({
            "type": "row_count_mismatch",
            "analytics_count": len(analytics_rows),
            "raw_count": len(raw_rows),
        })

    # Compare value columns row by row (sorted by value for consistency)
    def sort_key(row):
        return (str(row.get("entity_name", "")), str(row.get("fiscal_year", "")), str(row.get("metric_name", "")))

    sorted_a = sorted(analytics_rows, key=sort_key)
    sorted_r = sorted(raw_rows, key=sort_key)

    for i, (a, r) in enumerate(zip(sorted_a, sorted_r)):
        a_val = a.get("value")
        r_val = r.get("value")
        if a_val is not None and r_val is not None:
            try:
                if abs(float(a_val) - float(r_val)) > 0.01:
                    discrepancies.append({
                        "type": "value_mismatch",
                        "row": i,
                        "analytics_value": a_val,
                        "raw_value": r_val,
                        "context": {k: v for k, v in a.items() if k != "value"},
                    })
            except (ValueError, TypeError):
                pass

    match = len(discrepancies) == 0
    return match, discrepancies
