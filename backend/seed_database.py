"""Seed the database with realistic mock data for 6 institutions, 12 metrics, 10 fiscal years."""

import logging
import random
from datetime import date, datetime
from pathlib import Path

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# ── Entity definitions ──────────────────────────────────────────────────────

ENTITIES = [
    {"entity_id": "inst-state-university", "entity_name": "State University", "entity_type": "public"},
    {"entity_id": "inst-private-college", "entity_name": "Private College", "entity_type": "private"},
    {"entity_id": "inst-tech-institute", "entity_name": "Tech Institute", "entity_type": "public"},
    {"entity_id": "inst-liberal-arts", "entity_name": "Liberal Arts College", "entity_type": "private"},
    {"entity_id": "inst-community-college", "entity_name": "Community College", "entity_type": "public"},
    {"entity_id": "inst-research-university", "entity_name": "Research University", "entity_type": "public"},
]

# ── Metric base values per entity (realistic ranges) ────────────────────────
# Keys are metric_id, values are dict of entity_id -> base value (FY2015)

METRIC_BASES: dict[str, dict[str, float]] = {
    "metric-total-revenue": {
        "inst-state-university": 850_000_000,
        "inst-private-college": 420_000_000,
        "inst-tech-institute": 1_100_000_000,
        "inst-liberal-arts": 180_000_000,
        "inst-community-college": 120_000_000,
        "inst-research-university": 2_400_000_000,
    },
    "metric-tuition-revenue": {
        "inst-state-university": 320_000_000,
        "inst-private-college": 280_000_000,
        "inst-tech-institute": 390_000_000,
        "inst-liberal-arts": 130_000_000,
        "inst-community-college": 45_000_000,
        "inst-research-university": 620_000_000,
    },
    "metric-endowment": {
        "inst-state-university": 1_200_000_000,
        "inst-private-college": 800_000_000,
        "inst-tech-institute": 3_500_000_000,
        "inst-liberal-arts": 500_000_000,
        "inst-community-college": 25_000_000,
        "inst-research-university": 8_500_000_000,
    },
    "metric-total-enrollment": {
        "inst-state-university": 32000,
        "inst-private-college": 8500,
        "inst-tech-institute": 15000,
        "inst-liberal-arts": 2800,
        "inst-community-college": 12000,
        "inst-research-university": 48000,
    },
    "metric-undergrad-enrollment": {
        "inst-state-university": 25000,
        "inst-private-college": 6500,
        "inst-tech-institute": 10000,
        "inst-liberal-arts": 2500,
        "inst-community-college": 11500,
        "inst-research-university": 32000,
    },
    "metric-retention-rate": {
        "inst-state-university": 82.0,
        "inst-private-college": 88.0,
        "inst-tech-institute": 95.0,
        "inst-liberal-arts": 86.0,
        "inst-community-college": 58.0,
        "inst-research-university": 96.0,
    },
    "metric-6yr-grad-rate": {
        "inst-state-university": 65.0,
        "inst-private-college": 78.0,
        "inst-tech-institute": 90.0,
        "inst-liberal-arts": 75.0,
        "inst-community-college": 22.0,
        "inst-research-university": 93.0,
    },
    "metric-faculty-count": {
        "inst-state-university": 1800,
        "inst-private-college": 620,
        "inst-tech-institute": 1100,
        "inst-liberal-arts": 280,
        "inst-community-college": 350,
        "inst-research-university": 3200,
    },
    "metric-student-faculty-ratio": {
        "inst-state-university": 18.0,
        "inst-private-college": 12.0,
        "inst-tech-institute": 14.0,
        "inst-liberal-arts": 10.0,
        "inst-community-college": 22.0,
        "inst-research-university": 15.0,
    },
    "metric-research-expenditure": {
        "inst-state-university": 350_000_000,
        "inst-private-college": 45_000_000,
        "inst-tech-institute": 900_000_000,
        "inst-liberal-arts": 12_000_000,
        "inst-community-college": 2_000_000,
        "inst-research-university": 1_800_000_000,
    },
    "metric-admin-staff-count": {
        "inst-state-university": 2200,
        "inst-private-college": 750,
        "inst-tech-institute": 1400,
        "inst-liberal-arts": 320,
        "inst-community-college": 480,
        "inst-research-university": 4500,
    },
    "metric-deferred-maintenance": {
        "inst-state-university": 450_000_000,
        "inst-private-college": 120_000_000,
        "inst-tech-institute": 280_000_000,
        "inst-liberal-arts": 65_000_000,
        "inst-community-college": 95_000_000,
        "inst-research-university": 750_000_000,
    },
}

# Annual growth rates per metric (approximate)
GROWTH_RATES: dict[str, float] = {
    "metric-total-revenue": 0.035,
    "metric-tuition-revenue": 0.04,
    "metric-endowment": 0.06,
    "metric-total-enrollment": 0.005,
    "metric-undergrad-enrollment": 0.003,
    "metric-retention-rate": 0.003,       # slow improvement
    "metric-6yr-grad-rate": 0.004,        # slow improvement
    "metric-faculty-count": 0.01,
    "metric-student-faculty-ratio": -0.005,  # slight decrease (improving)
    "metric-research-expenditure": 0.045,
    "metric-admin-staff-count": 0.02,
    "metric-deferred-maintenance": 0.05,   # backlog grows
}

# Units from the YAML
METRIC_UNITS: dict[str, str] = {
    "metric-total-revenue": "currency",
    "metric-tuition-revenue": "currency",
    "metric-endowment": "currency",
    "metric-total-enrollment": "count",
    "metric-undergrad-enrollment": "count",
    "metric-retention-rate": "percentage",
    "metric-6yr-grad-rate": "percentage",
    "metric-faculty-count": "count",
    "metric-student-faculty-ratio": "ratio",
    "metric-research-expenditure": "currency",
    "metric-admin-staff-count": "count",
    "metric-deferred-maintenance": "currency",
}

# Entity metadata for dimensions
ENTITY_META: dict[str, dict] = {
    "inst-state-university": {"institution_type": "public", "peer_group": "Regional University", "region": "Midwest"},
    "inst-private-college": {"institution_type": "private", "peer_group": "Liberal Arts College", "region": "Northeast"},
    "inst-tech-institute": {"institution_type": "public", "peer_group": "Research University", "region": "Northeast"},
    "inst-liberal-arts": {"institution_type": "private", "peer_group": "Liberal Arts College", "region": "Southeast"},
    "inst-community-college": {"institution_type": "public", "peer_group": "Community College", "region": "West"},
    "inst-research-university": {"institution_type": "public", "peer_group": "Research University", "region": "West"},
}

FISCAL_YEARS = list(range(2015, 2025))  # 2015-2024


def _generate_value(metric_id: str, entity_id: str, year: int) -> float:
    """Generate a realistic value for a metric/entity/year combo with deterministic randomness."""
    base = METRIC_BASES[metric_id][entity_id]
    growth = GROWTH_RATES[metric_id]
    years_from_base = year - 2015

    # Use deterministic seed for reproducibility
    rng = random.Random(hash((metric_id, entity_id, year)))

    # Apply growth with some noise
    noise = rng.gauss(0, 0.015)  # ~1.5% noise
    value = base * ((1 + growth + noise) ** years_from_base)

    unit = METRIC_UNITS[metric_id]
    if unit == "percentage":
        value = max(0.0, min(100.0, value))
        return round(value, 1)
    elif unit == "ratio":
        value = max(1.0, min(50.0, value))
        return round(value, 1)
    elif unit == "count":
        return max(0, round(value))
    else:
        # currency – round to nearest thousand
        return max(0, round(value, -3))


def seed_database(db: Session) -> None:
    """Seed the database with mock data. Idempotent – skips if entities already exist."""
    from app.db.models import (
        Entity, MetricDefinition, MetricObservation,
        Dimension, ObservationDimension, SourceDocument,
        SourceType,
    )

    # Check if already seeded
    existing = db.query(Entity).count()
    if existing > 0:
        logger.info(f"Database already has {existing} entities – skipping seed")
        return

    logger.info("Seeding database with mock data...")

    # 1. Create source document
    source_doc = SourceDocument(
        source_document_id="seed-source-doc",
        source_type=SourceType.API,
        source_name="Database Seed Script",
        source_url=None,
        raw_metadata={"generator": "seed_database.py", "version": "1.0"},
    )
    db.add(source_doc)

    # 2. Create entities
    for ent in ENTITIES:
        entity = Entity(
            entity_id=ent["entity_id"],
            entity_name=ent["entity_name"],
            entity_type=ent["entity_type"],
            entity_metadata=ENTITY_META.get(ent["entity_id"], {}),
        )
        db.add(entity)
    logger.info(f"Created {len(ENTITIES)} entities")

    # 3. Ensure dimensions exist
    dimension_defs = [
        ("peer_group", "categorical", "Peer group classification"),
        ("institution_type", "categorical", "Institution type (public/private)"),
        ("region", "categorical", "Geographic region"),
    ]
    dim_id_map: dict[str, str] = {}
    for dim_name, dim_type, desc in dimension_defs:
        existing_dim = db.query(Dimension).filter(Dimension.dimension_name == dim_name).first()
        if existing_dim:
            dim_id_map[dim_name] = existing_dim.dimension_id
        else:
            dim_id = f"dim-{dim_name}"
            dim = Dimension(
                dimension_id=dim_id,
                dimension_name=dim_name,
                dimension_type=dim_type,
                description=desc,
            )
            db.add(dim)
            dim_id_map[dim_name] = dim_id

    db.flush()  # ensure IDs are available

    # 4. Create observations + observation_dimensions
    obs_count = 0
    dim_count = 0
    metric_ids = list(METRIC_BASES.keys())

    for metric_id in metric_ids:
        # Verify metric exists in metric_definitions
        metric_def = db.query(MetricDefinition).filter(MetricDefinition.metric_id == metric_id).first()
        if not metric_def:
            logger.warning(f"Metric {metric_id} not in metric_definitions – skipping observations")
            continue

        for ent in ENTITIES:
            entity_id = ent["entity_id"]
            meta = ENTITY_META[entity_id]

            for year in FISCAL_YEARS:
                value = _generate_value(metric_id, entity_id, year)
                obs_id = f"obs-{metric_id}-{entity_id}-{year}"

                obs = MetricObservation(
                    observation_id=obs_id,
                    metric_id=metric_id,
                    entity_id=entity_id,
                    observation_date=date(year, 6, 30),
                    value=value,
                    unit=METRIC_UNITS[metric_id],
                    source_document_id="seed-source-doc",
                    confidence=0.95,
                )
                db.add(obs)
                obs_count += 1

                # Attach dimension values
                for dim_name in ["peer_group", "institution_type", "region"]:
                    od = ObservationDimension(
                        observation_id=obs_id,
                        dimension_id=dim_id_map[dim_name],
                        dimension_value=meta[dim_name],
                    )
                    db.add(od)
                    dim_count += 1

    db.commit()
    logger.info(f"Seed complete: {obs_count} observations, {dim_count} observation_dimensions")


def sync_glossary_to_db(db: Session) -> None:
    """Sync glossary YAML metrics into metric_definitions table so IDs match."""
    import yaml
    from app.db.models import MetricDefinition, ValueType, AggregationType

    glossary_path = Path(__file__).parent / "app" / "data" / "glossary" / "metrics.yaml"
    if not glossary_path.exists():
        logger.warning(f"Glossary YAML not found at {glossary_path}")
        return

    with open(glossary_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    metrics = data.get("metrics", [])
    created = 0
    updated = 0

    for m in metrics:
        metric_id = m.get("id")
        if not metric_id:
            continue

        # Skip metric-uk-pop as specified in plan
        if metric_id == "metric-uk-pop":
            continue

        existing = db.query(MetricDefinition).filter(MetricDefinition.metric_id == metric_id).first()

        unit = m.get("unit", "")
        value_type = ValueType.NUMBER
        if unit:
            u = unit.lower()
            if "percentage" in u or "%" in u:
                value_type = ValueType.PERCENTAGE
            elif "count" in u:
                value_type = ValueType.INTEGER

        if existing:
            existing.canonical_name = m.get("canonical_name", m.get("name", ""))
            existing.description = m.get("description", "")
            existing.unit = unit
            existing.value_type = value_type
            existing.category = m.get("domain", "finance")
            existing.calculation_logic = m.get("calculation_logic", "")
            existing.data_owner = m.get("data_owner", "")
            existing.source = m.get("source", "")
            existing.update_frequency = m.get("update_frequency", "annual")
            existing.version = m.get("version", "1.0")
            existing.dimensions = m.get("dimensions", [])
            existing.entities = m.get("entities", ["Institution"])
            existing.is_active = 1 if m.get("is_active", True) else 0
            existing.updated_at = datetime.utcnow()
            updated += 1
        else:
            effective_date = None
            ed_str = m.get("effective_date")
            if ed_str:
                try:
                    effective_date = datetime.strptime(str(ed_str), "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    pass

            new_metric = MetricDefinition(
                metric_id=metric_id,
                canonical_name=m.get("canonical_name", m.get("name", "")),
                description=m.get("description", ""),
                unit=unit,
                value_type=value_type,
                default_aggregation=AggregationType.SUM,
                category=m.get("domain", "finance"),
                calculation_logic=m.get("calculation_logic", ""),
                data_owner=m.get("data_owner", ""),
                source=m.get("source", ""),
                update_frequency=m.get("update_frequency", "annual"),
                version=m.get("version", "1.0"),
                effective_date=effective_date,
                is_active=1 if m.get("is_active", True) else 0,
                dimensions=m.get("dimensions", []),
                entities=m.get("entities", ["Institution"]),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(new_metric)
            created += 1

    db.commit()
    logger.info(f"Glossary sync: {created} created, {updated} updated")
