"""SQLite-based glossary loader."""

import logging
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.glossary import GlossaryMetric, EntityDefinition, DimensionDefinition, MetricDomain
from app.db.database import get_db_session
from app.db.models import (
    MetricDefinition as DBMetricDefinition,
    MetricAlias as DBMetricAlias,
    Dimension as DBDimension,
    Entity as DBEntity,
    ValueType,
    AggregationType,
    DimensionType
)

logger = logging.getLogger(__name__)


class GlossaryLoaderDB:
    """Loads and manages glossary definitions from SQLite database."""

    def __init__(self):
        """Initialize database glossary loader."""
        self._metrics_cache: Dict[str, GlossaryMetric] = {}
        self._entities_cache: Dict[str, EntityDefinition] = {}
        self._dimensions_cache: Dict[str, DimensionDefinition] = {}
        self._loaded = False

    def load_all(self) -> None:
        """Load all glossary definitions from database."""
        if self._loaded:
            return

        try:
            # Ensure database is initialized
            from app.db.database import init_db
            init_db()
            
            db = get_db_session()
            try:
                # Load dimensions
                import json
                db_dimensions = db.query(DBDimension).all()
                for db_dim in db_dimensions:
                    # Get authorized values from JSON column
                    values = None
                    if db_dim.authorized_values:
                        if isinstance(db_dim.authorized_values, list):
                            values = db_dim.authorized_values
                        elif isinstance(db_dim.authorized_values, str):
                            try:
                                values = json.loads(db_dim.authorized_values)
                            except:
                                values = None
                    
                    dim_def = DimensionDefinition(
                        id=db_dim.dimension_id,
                        name=db_dim.dimension_name,
                        description=db_dim.description or "",
                        type=db_dim.dimension_type.value,
                        values=values
                    )
                    self._dimensions_cache[db_dim.dimension_id] = dim_def
                logger.info(f"Loaded {len(self._dimensions_cache)} dimensions from database")

                # Load metrics
                db_metrics = db.query(DBMetricDefinition).all()
                for db_metric in db_metrics:
                    # Get aliases
                    aliases = db.query(DBMetricAlias).filter(
                        DBMetricAlias.metric_id == db_metric.metric_id
                    ).all()
                    semantic_variations = [alias.source_metric_name for alias in aliases]

                    # Convert to GlossaryMetric
                    glossary_metric = GlossaryMetric(
                        id=db_metric.metric_id,
                        domain=MetricDomain(db_metric.category) if db_metric.category else MetricDomain.FINANCE,
                        name=db_metric.canonical_name,
                        canonical_name=db_metric.canonical_name,
                        description=db_metric.description or "",
                        calculation_logic=db_metric.calculation_logic or "",
                        data_owner=db_metric.data_owner or "",
                        source=db_metric.source or "internal-document",
                        update_frequency=db_metric.update_frequency or "annual",
                        unit=db_metric.unit or "",
                        semantic_variations=semantic_variations,
                        validation_rules=[],
                        entities=["Institution"],  # Default - we'll need to link this properly
                        dimensions=[],  # We'll need to link this properly
                        version=db_metric.version or "1.0",
                        effective_date=db_metric.effective_date.isoformat() if db_metric.effective_date else (db_metric.created_at.date().isoformat() if db_metric.created_at else datetime.utcnow().date().isoformat()),
                        is_active=bool(db_metric.is_active) if db_metric.is_active is not None else True
                    )
                    self._metrics_cache[db_metric.metric_id] = glossary_metric
                logger.info(f"Loaded {len(self._metrics_cache)} metrics from database")

            finally:
                db.close()

            self._loaded = True
        except Exception as e:
            logger.error(f"Error loading glossary from database: {e}", exc_info=True)
            raise

    def get_metric(self, metric_id: str) -> Optional[GlossaryMetric]:
        """Get a metric by ID."""
        if not self._loaded:
            self.load_all()
        return self._metrics_cache.get(metric_id)

    def get_all_metrics(self) -> List[GlossaryMetric]:
        """Get all metrics."""
        if not self._loaded:
            self.load_all()
        return list(self._metrics_cache.values())

    def get_metrics_by_domain(self, domain: MetricDomain) -> List[GlossaryMetric]:
        """Get all metrics for a specific domain."""
        if not self._loaded:
            self.load_all()
        return [m for m in self._metrics_cache.values() if m.domain == domain and m.is_active]

    def get_dimension(self, dimension_id: str) -> Optional[DimensionDefinition]:
        """Get a dimension definition by ID."""
        if not self._loaded:
            self.load_all()
        return self._dimensions_cache.get(dimension_id)

    def get_all_dimensions(self) -> List[DimensionDefinition]:
        """Get all dimension definitions."""
        if not self._loaded:
            self.load_all()
        return list(self._dimensions_cache.values())

    def search_metrics(self, query: str, domain: Optional[MetricDomain] = None) -> List[GlossaryMetric]:
        """Search metrics by name or description."""
        if not self._loaded:
            self.load_all()

        query_lower = query.lower()
        results = []

        for metric in self._metrics_cache.values():
            if not metric.is_active:
                continue
            if domain and metric.domain != domain:
                continue

            # Search in name, canonical_name, description, and variations
            if (query_lower in metric.name.lower() or
                query_lower in metric.canonical_name.lower() or
                query_lower in metric.description.lower() or
                any(query_lower in var.lower() for var in metric.semantic_variations)):
                results.append(metric)

        return results

    def reload(self) -> None:
        """Reload glossary definitions from database."""
        self._loaded = False
        self._metrics_cache.clear()
        self._entities_cache.clear()
        self._dimensions_cache.clear()
        self.load_all()

    def save_metric(self, metric: GlossaryMetric) -> bool:
        """Save a metric to the database."""
        try:
            db = get_db_session()
            try:
                # Check if metric exists
                db_metric = db.query(DBMetricDefinition).filter(
                    DBMetricDefinition.metric_id == metric.id
                ).first()

                if db_metric:
                    # Update existing
                    db_metric.canonical_name = metric.canonical_name
                    db_metric.description = metric.description
                    db_metric.unit = metric.unit
                    db_metric.category = metric.domain.value
                    db_metric.calculation_logic = metric.calculation_logic
                    db_metric.data_owner = metric.data_owner
                    db_metric.source = metric.source
                    db_metric.update_frequency = metric.update_frequency
                    db_metric.version = metric.version
                    db_metric.effective_date = datetime.strptime(metric.effective_date, "%Y-%m-%d").date() if metric.effective_date else None
                    db_metric.is_active = 1 if metric.is_active else 0
                    db_metric.updated_at = datetime.utcnow()
                else:
                    # Create new
                    value_type = ValueType.NUMBER
                    if metric.unit == "percentage":
                        value_type = ValueType.PERCENTAGE
                    elif metric.unit == "count":
                        value_type = ValueType.INTEGER

                    effective_date = None
                    if metric.effective_date:
                        try:
                            effective_date = datetime.strptime(metric.effective_date, "%Y-%m-%d").date()
                        except:
                            pass

                    db_metric = DBMetricDefinition(
                        metric_id=metric.id,
                        canonical_name=metric.canonical_name,
                        description=metric.description,
                        unit=metric.unit,
                        value_type=value_type,
                        default_aggregation=AggregationType.SUM,
                        category=metric.domain.value,
                        calculation_logic=metric.calculation_logic,
                        data_owner=metric.data_owner,
                        source=metric.source,
                        update_frequency=metric.update_frequency,
                        version=metric.version,
                        effective_date=effective_date,
                        is_active=1 if metric.is_active else 0,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(db_metric)

                # Update aliases (semantic variations)
                # Delete existing aliases
                db.query(DBMetricAlias).filter(
                    DBMetricAlias.metric_id == metric.id
                ).delete()

                # Add new aliases
                for variation in metric.semantic_variations:
                    alias = DBMetricAlias(
                        alias_id=str(uuid.uuid4()),
                        metric_id=metric.id,
                        source_system="internal",
                        source_metric_name=variation,
                        confidence=0.9,
                        created_at=datetime.utcnow()
                    )
                    db.add(alias)

                db.commit()
                logger.info(f"Metric saved to database: {metric.id}")

                # Update cache
                self._metrics_cache[metric.id] = metric
                return True
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error saving metric to database: {e}", exc_info=True)
            return False

    def save_dimension(self, dimension: DimensionDefinition) -> bool:
        """Save a dimension definition to the database."""
        try:
            db = get_db_session()
            try:
                # Check if dimension exists
                db_dim = db.query(DBDimension).filter(
                    DBDimension.dimension_id == dimension.id
                ).first()

                dim_type = DimensionType.CATEGORICAL
                if dimension.type == "time":
                    dim_type = DimensionType.NUMERICAL
                elif dimension.type == "geography":
                    dim_type = DimensionType.CATEGORICAL

                if db_dim:
                    # Update existing
                    db_dim.dimension_name = dimension.name
                    db_dim.dimension_type = dim_type
                    db_dim.description = dimension.description
                    db_dim.authorized_values = dimension.values if dimension.values else None
                else:
                    # Create new
                    db_dim = DBDimension(
                        dimension_id=dimension.id,
                        dimension_name=dimension.name,
                        dimension_type=dim_type,
                        description=dimension.description,
                        authorized_values=dimension.values if dimension.values else None,
                        created_at=datetime.utcnow()
                    )
                    db.add(db_dim)

                db.commit()
                logger.info(f"Dimension saved to database: {dimension.id}")

                # Update cache
                self._dimensions_cache[dimension.id] = dimension
                return True
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error saving dimension to database: {e}", exc_info=True)
            return False


# Global instance
_glossary_loader_db: Optional[GlossaryLoaderDB] = None


def get_glossary_loader_db() -> GlossaryLoaderDB:
    """Get the global database glossary loader instance."""
    global _glossary_loader_db
    if _glossary_loader_db is None:
        _glossary_loader_db = GlossaryLoaderDB()
    return _glossary_loader_db
