"""Database migration utilities."""

import logging
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import get_db_session, init_db
from app.db.models import (
    MetricDefinition, MetricAlias, Entity, Dimension, 
    SourceDocument, MetricObservation, ObservationDimension,
    ValueType, AggregationType, DimensionType, SourceType
)
from app.models.glossary import GlossaryMetric, DimensionDefinition as GlossaryDimension
from app.services.glossary_loader import get_glossary_loader
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)


def migrate_glossary_from_yaml(db: Session) -> None:
    """Migrate glossary metrics and dimensions from YAML to database."""
    logger.info("Migrating glossary from YAML to database...")
    
    glossary_loader = get_glossary_loader()
    glossary_loader.load_all()
    
    # Migrate dimensions first
    dimensions = glossary_loader.get_all_dimensions()
    dimension_map = {}  # Map old dimension IDs to new UUIDs
    
    for dim_def in dimensions:
        # Check if dimension already exists
        existing = db.query(Dimension).filter(
            Dimension.dimension_name == dim_def.name
        ).first()
        
        if existing:
            dimension_map[dim_def.id] = existing.dimension_id
            logger.info(f"Dimension '{dim_def.name}' already exists, skipping")
            continue
        
        # Map dimension type
        dim_type = DimensionType.CATEGORICAL
        if dim_def.type == "time":
            dim_type = DimensionType.NUMERICAL
        elif dim_def.type == "geography":
            dim_type = DimensionType.CATEGORICAL
        elif dim_def.type == "categorical":
            dim_type = DimensionType.CATEGORICAL
        
        new_dim = Dimension(
            dimension_id=str(uuid.uuid4()),
            dimension_name=dim_def.name,
            dimension_type=dim_type,
            created_at=datetime.utcnow()
        )
        db.add(new_dim)
        dimension_map[dim_def.id] = new_dim.dimension_id
        logger.info(f"Migrated dimension: {dim_def.name}")
    
    # Migrate metrics
    metrics = glossary_loader.get_all_metrics()
    
    for metric in metrics:
        # Check if metric already exists
        existing = db.query(MetricDefinition).filter(
            MetricDefinition.canonical_name == metric.canonical_name
        ).first()
        
        if existing:
            logger.info(f"Metric '{metric.canonical_name}' already exists, skipping")
            continue
        
        # Map value type based on unit
        value_type = ValueType.NUMBER
        if metric.unit == "percentage":
            value_type = ValueType.PERCENTAGE
        elif metric.unit == "count":
            value_type = ValueType.INTEGER
        elif metric.unit == "boolean":
            value_type = ValueType.BOOLEAN
        elif metric.unit == "text":
            value_type = ValueType.TEXT
        
        # Map aggregation (default to SUM for most metrics)
        aggregation = AggregationType.SUM
        if "rate" in metric.name.lower() or "percentage" in metric.unit.lower():
            aggregation = AggregationType.AVG
        elif "count" in metric.name.lower():
            aggregation = AggregationType.COUNT
        
        new_metric = MetricDefinition(
            metric_id=metric.id if metric.id.startswith("metric-") else f"metric-{metric.id}",
            canonical_name=metric.canonical_name,
            description=metric.description,
            unit=metric.unit,
            value_type=value_type,
            default_aggregation=aggregation,
            category=metric.domain.value,  # Use domain as category
            created_at=datetime.utcnow()
        )
        db.add(new_metric)
        
        # Add semantic variations as aliases
        for variation in metric.semantic_variations:
            alias = MetricAlias(
                alias_id=str(uuid.uuid4()),
                metric_id=new_metric.metric_id,
                source_system="internal",
                source_metric_name=variation,
                confidence=0.9,
                created_at=datetime.utcnow()
            )
            db.add(alias)
        
        logger.info(f"Migrated metric: {metric.canonical_name}")
    
    db.commit()
    logger.info("Glossary migration completed")


def run_migrations() -> None:
    """Run all database migrations."""
    logger.info("Running database migrations...")
    
    # Initialize database schema
    init_db()
    
    # Migrate data from YAML
    db = get_db_session()
    try:
        migrate_glossary_from_yaml(db)
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()
    
    logger.info("Migrations completed successfully")


if __name__ == "__main__":
    # Run migrations when script is executed directly
    run_migrations()
