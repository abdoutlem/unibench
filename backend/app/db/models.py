"""SQLAlchemy models for the database schema."""

from sqlalchemy import (
    Column, String, Integer, Numeric, Date, DateTime, ForeignKey, 
    Enum as SQLEnum, Text, JSON, UniqueConstraint, Index
)
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from enum import Enum

Base = declarative_base()


class ValueType(str, Enum):
    """Metric value types."""
    NUMBER = "number"
    INTEGER = "integer"
    PERCENTAGE = "percentage"
    BOOLEAN = "boolean"
    TEXT = "text"


class AggregationType(str, Enum):
    """Default aggregation types."""
    SUM = "sum"
    AVG = "avg"
    MIN = "min"
    MAX = "max"
    COUNT = "count"


class DimensionType(str, Enum):
    """Dimension types."""
    CATEGORICAL = "categorical"
    NUMERICAL = "numerical"
    BOOLEAN = "boolean"


class SourceType(str, Enum):
    """Source document types."""
    PDF = "pdf"
    WEB = "web"
    EXCEL = "excel"
    IMAGE = "image"
    API = "api"


class MetricDefinition(Base):
    """Core metric definitions."""
    __tablename__ = "metric_definitions"
    
    metric_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    canonical_name = Column(Text, unique=True, nullable=False)
    description = Column(Text)
    unit = Column(Text)
    value_type = Column(SQLEnum(ValueType), nullable=False, default=ValueType.NUMBER)
    default_aggregation = Column(SQLEnum(AggregationType), nullable=False, default=AggregationType.SUM)
    category = Column(Text)
    # Additional fields for compatibility with GlossaryMetric
    calculation_logic = Column(Text)
    data_owner = Column(Text)
    source = Column(Text)
    update_frequency = Column(Text)
    version = Column(Text, default="1.0")
    effective_date = Column(Date)
    is_active = Column(Integer, default=1)  # SQLite doesn't have boolean, use 0/1
    dimensions = Column(SQLiteJSON)  # Store dimensions as JSON array (e.g., ["FiscalYear", "DocumentType"])
    entities = Column(SQLiteJSON)  # Store entities as JSON array (e.g., ["Institution"])
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    aliases = relationship("MetricAlias", back_populates="metric", cascade="all, delete-orphan")
    observations = relationship("MetricObservation", back_populates="metric", cascade="all, delete-orphan")


class MetricAlias(Base):
    """Source-specific metric name mappings."""
    __tablename__ = "metric_aliases"
    
    alias_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_id = Column(String(36), ForeignKey("metric_definitions.metric_id", ondelete="CASCADE"), nullable=False)
    source_system = Column(Text, nullable=False)
    source_metric_name = Column(Text, nullable=False)
    confidence = Column(Numeric(3, 2), default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    metric = relationship("MetricDefinition", back_populates="aliases")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("source_system", "source_metric_name", name="uq_source_system_metric"),
    )


class Entity(Base):
    """Entities that can be measured (organizations, buildings, devices, etc.)."""
    __tablename__ = "entities"
    
    entity_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(Text, nullable=False)
    entity_name = Column(Text, nullable=False)
    parent_entity_id = Column(String(36), ForeignKey("entities.entity_id", ondelete="SET NULL"), nullable=True)
    entity_metadata = Column(SQLiteJSON)  # JSONB equivalent for SQLite (renamed from 'metadata' to avoid SQLAlchemy reserved name)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    parent = relationship("Entity", remote_side=[entity_id], backref="children")
    observations = relationship("MetricObservation", back_populates="entity", cascade="all, delete-orphan")


class Dimension(Base):
    """Dimension definitions (gender, contract_type, energy_type, etc.)."""
    __tablename__ = "dimensions"
    
    dimension_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dimension_name = Column(Text, unique=True, nullable=False)
    dimension_type = Column(SQLEnum(DimensionType), nullable=False, default=DimensionType.CATEGORICAL)
    description = Column(Text)  # Add description field
    authorized_values = Column(SQLiteJSON)  # Store authorized values as JSON array
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    observation_dimensions = relationship("ObservationDimension", back_populates="dimension", cascade="all, delete-orphan")


class SourceDocument(Base):
    """Source document traceability."""
    __tablename__ = "source_documents"
    
    source_document_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_type = Column(SQLEnum(SourceType), nullable=False)
    source_name = Column(Text, nullable=False)
    source_url = Column(Text)
    extracted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    raw_metadata = Column(SQLiteJSON)  # JSONB equivalent for SQLite
    
    # Relationships
    observations = relationship("MetricObservation", back_populates="source_document", cascade="all, delete-orphan")


class MetricObservation(Base):
    """Fact table for metric observations."""
    __tablename__ = "metric_observations"
    
    observation_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_id = Column(String(36), ForeignKey("metric_definitions.metric_id", ondelete="CASCADE"), nullable=False)
    entity_id = Column(String(36), ForeignKey("entities.entity_id", ondelete="CASCADE"), nullable=False)
    observation_date = Column(Date, nullable=False)
    value = Column(Numeric, nullable=False)
    unit = Column(Text)
    source_document_id = Column(String(36), ForeignKey("source_documents.source_document_id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Numeric(3, 2), default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    metric = relationship("MetricDefinition", back_populates="observations")
    entity = relationship("Entity", back_populates="observations")
    source_document = relationship("SourceDocument", back_populates="observations")
    observation_dimensions = relationship("ObservationDimension", back_populates="observation", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_metric_observation_date", "metric_id", "observation_date"),
        Index("idx_entity_observation_date", "entity_id", "observation_date"),
    )


class ObservationDimension(Base):
    """Associates observations with flexible dimensions (key-value)."""
    __tablename__ = "observation_dimensions"
    
    observation_id = Column(String(36), ForeignKey("metric_observations.observation_id", ondelete="CASCADE"), primary_key=True)
    dimension_id = Column(String(36), ForeignKey("dimensions.dimension_id", ondelete="CASCADE"), primary_key=True)
    dimension_value = Column(Text, nullable=False)
    
    # Relationships
    observation = relationship("MetricObservation", back_populates="observation_dimensions")
    dimension = relationship("Dimension", back_populates="observation_dimensions")


class MetricMappingConfig(Base):
    """Configuration for mapping raw metric names to canonical metrics."""
    __tablename__ = "metric_mapping_configs"
    
    config_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_metric_name = Column(Text, unique=True, nullable=False)
    metric_id = Column(String(36), ForeignKey("metric_definitions.metric_id", ondelete="CASCADE"), nullable=False)
    confidence = Column(Numeric(3, 2), default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    metric = relationship("MetricDefinition", backref="mapping_configs")


class UnmappedObservation(Base):
    """Observations with raw metric names that haven't been mapped to glossary yet."""
    __tablename__ = "unmapped_observations"
    
    observation_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_metric_name = Column(Text, nullable=False, index=True)
    entity_id = Column(String(36), ForeignKey("entities.entity_id", ondelete="CASCADE"), nullable=False)
    observation_date = Column(Date, nullable=False)
    value = Column(Numeric, nullable=False)
    unit = Column(Text)
    dimensions = Column(SQLiteJSON)  # Store dimensions as JSON
    aggregation = Column(Text)  # Store aggregation description
    source_document_id = Column(String(36), ForeignKey("source_documents.source_document_id", ondelete="SET NULL"), nullable=True)
    source_url = Column(Text)
    source_name = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    entity = relationship("Entity")
    source_document = relationship("SourceDocument")
    
    # Indexes
    __table_args__ = (
        Index("idx_unmapped_raw_metric", "raw_metric_name"),
        Index("idx_unmapped_entity_date", "entity_id", "observation_date"),
    )


class SavedReport(Base):
    """Saved analytics reports."""
    __tablename__ = "saved_reports"

    report_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(Text, nullable=False)
    description = Column(Text)
    tags = Column(SQLiteJSON, default=[])
    query_config = Column(SQLiteJSON, nullable=False)
    chart_type = Column(Text, nullable=False)
    chart_config = Column(SQLiteJSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Text)
