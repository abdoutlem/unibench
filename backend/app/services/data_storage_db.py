"""SQLite-based data storage service."""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.unified_data import FactMetric, ComparisonQuery, ComparisonResult
from app.models.glossary import MetricDomain
from app.db.database import get_db_session
from app.db.models import (
    MetricObservation as DBMetricObservation,
    ObservationDimension as DBObservationDimension,
    Entity as DBEntity,
    SourceDocument as DBSourceDocument,
    Dimension as DBDimension
)
import uuid

logger = logging.getLogger(__name__)


class DataStorageDB:
    """SQLite-based storage for extracted metric facts."""

    def __init__(self):
        """Initialize database storage."""
        pass

    def save_extracted_fact(self, fact: FactMetric) -> None:
        """Save an extracted fact to the database."""
        # Ensure database is initialized
        from app.db.database import init_db
        init_db()
        
        db = get_db_session()
        try:
            # Ensure entity exists
            entity = db.query(DBEntity).filter(
                DBEntity.entity_id == fact.entity_id
            ).first()
            
            if not entity:
                # Create entity if it doesn't exist
                entity = DBEntity(
                    entity_id=fact.entity_id,
                    entity_type="Institution",  # Default
                    entity_name=fact.entity_id,
                    created_at=datetime.utcnow()
                )
                db.add(entity)
            
            # Ensure source document exists if provided
            source_doc_id = None
            if fact.source_document_id:
                source_doc = db.query(DBSourceDocument).filter(
                    DBSourceDocument.source_document_id == fact.source_document_id
                ).first()
                
                if not source_doc:
                    # Create source document
                    source_doc = DBSourceDocument(
                        source_document_id=fact.source_document_id,
                        source_type="pdf",  # Default
                        source_name=fact.source_document_id,
                        extracted_at=datetime.utcnow()
                    )
                    db.add(source_doc)
                source_doc_id = fact.source_document_id
            
            # Extract observation date from dimension_values or use current date
            observation_date = date.today()
            if "fiscal_year" in fact.dimension_values:
                fiscal_year = fact.dimension_values["fiscal_year"]
                if isinstance(fiscal_year, int):
                    observation_date = date(fiscal_year, 1, 1)
            
            # Create observation
            observation = DBMetricObservation(
                observation_id=fact.id,
                metric_id=fact.metric_id,
                entity_id=fact.entity_id,
                observation_date=observation_date,
                value=float(fact.value),
                unit=fact.unit,
                source_document_id=source_doc_id,
                confidence=float(fact.confidence),
                created_at=fact.extracted_at if isinstance(fact.extracted_at, datetime) else datetime.utcnow()
            )
            db.add(observation)
            
            # Add dimension values
            for dim_key, dim_value in fact.dimension_values.items():
                if dim_key in ["fiscal_year", "observation_date"]:
                    continue  # Already handled
                
                # Find or create dimension
                db_dim = db.query(DBDimension).filter(
                    DBDimension.dimension_name == dim_key
                ).first()
                
                if not db_dim:
                    # Create dimension if it doesn't exist
                    db_dim = DBDimension(
                        dimension_id=str(uuid.uuid4()),
                        dimension_name=dim_key,
                        dimension_type="categorical",
                        created_at=datetime.utcnow()
                    )
                    db.add(db_dim)
                    db.flush()  # Get the dimension_id
                
                # Create observation dimension
                obs_dim = DBObservationDimension(
                    observation_id=fact.id,
                    dimension_id=db_dim.dimension_id,
                    dimension_value=str(dim_value)
                )
                db.add(obs_dim)
            
            db.commit()
            logger.info(f"Saved fact to database: {fact.id}")
        except Exception as e:
            logger.error(f"Error saving fact to database: {e}", exc_info=True)
            db.rollback()
            raise
        finally:
            db.close()

    def query_facts(
        self,
        metric_ids: Optional[List[str]] = None,
        entity_ids: Optional[List[str]] = None,
        domain: Optional[MetricDomain] = None,
        fiscal_years: Optional[List[int]] = None,
        fiscal_year_start: Optional[int] = None,
        fiscal_year_end: Optional[int] = None,
        include_pending: bool = False,
        limit: int = 100
    ) -> List[FactMetric]:
        """Query facts with filters."""
        # Ensure database is initialized
        from app.db.database import init_db
        init_db()
        
        db = get_db_session()
        try:
            query = db.query(DBMetricObservation)
            
            # Apply filters
            if metric_ids:
                query = query.filter(DBMetricObservation.metric_id.in_(metric_ids))
            
            if entity_ids:
                query = query.filter(DBMetricObservation.entity_id.in_(entity_ids))
            
            if fiscal_years:
                # Filter by fiscal year in observation_date
                conditions = []
                for year in fiscal_years:
                    conditions.append(
                        and_(
                            DBMetricObservation.observation_date >= date(year, 1, 1),
                            DBMetricObservation.observation_date < date(year + 1, 1, 1)
                        )
                    )
                if conditions:
                    query = query.filter(or_(*conditions))
            
            if fiscal_year_start:
                query = query.filter(DBMetricObservation.observation_date >= date(fiscal_year_start, 1, 1))
            
            if fiscal_year_end:
                query = query.filter(DBMetricObservation.observation_date < date(fiscal_year_end + 1, 1, 1))
            
            # Apply limit
            query = query.limit(limit)
            
            # Execute query
            db_observations = query.all()
            
            # Convert to FactMetric
            facts = []
            for obs in db_observations:
                # Get dimension values
                obs_dims = db.query(DBObservationDimension).filter(
                    DBObservationDimension.observation_id == obs.observation_id
                ).all()
                
                dimension_values = {}
                # Add fiscal year from observation_date
                dimension_values["fiscal_year"] = obs.observation_date.year
                
                for obs_dim in obs_dims:
                    dim = db.query(DBDimension).filter(
                        DBDimension.dimension_id == obs_dim.dimension_id
                    ).first()
                    if dim:
                        dimension_values[dim.dimension_name] = obs_dim.dimension_value
                
                fact = FactMetric(
                    id=obs.observation_id,
                    entity_id=obs.entity_id,
                    metric_id=obs.metric_id,
                    domain=domain or MetricDomain.FINANCE,  # Default
                    dimension_values=dimension_values,
                    value=float(obs.value),
                    unit=obs.unit or "",
                    confidence=float(obs.confidence) if obs.confidence else 1.0,
                    source_document_id=obs.source_document_id,
                    extraction_job_id=None,  # We'll need to add this
                    extracted_at=obs.created_at,
                    validated_at=None,
                    validation_status="pending_review",
                    notes=None
                )
                facts.append(fact)
            
            return facts
        finally:
            db.close()

    def compare_metrics(
        self,
        metric_ids: List[str],
        entity_ids: Optional[List[str]] = None,
        fiscal_years: Optional[List[int]] = None,
        group_by: Optional[List[str]] = None
    ) -> List[ComparisonResult]:
        """Compare metrics across entities."""
        # Get facts for the metrics
        facts = self.query_facts(
            metric_ids=metric_ids,
            entity_ids=entity_ids,
            fiscal_years=fiscal_years,
            limit=1000
        )
        
        # Group by metric_id
        results = []
        for metric_id in metric_ids:
            metric_facts = [f for f in facts if f.metric_id == metric_id]
            
            if metric_facts:
                result = ComparisonResult(
                    metric_id=metric_id,
                    metric_name=metric_facts[0].metric_id,  # We'll need to get the name
                    domain=metric_facts[0].domain,
                    data_points=metric_facts
                )
                results.append(result)
        
        return results
