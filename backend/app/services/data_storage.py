"""Service for storing and querying extracted data facts."""

import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.unified_data import FactMetric, ComparisonQuery, ComparisonResult
from app.models.glossary import MetricDomain

logger = logging.getLogger(__name__)


class DataStorage:
    """Stores and queries extracted metric facts."""

    def __init__(self, storage_dir: Optional[Path] = None):
        """Initialize data storage."""
        if storage_dir is None:
            base_dir = Path(__file__).parent.parent
            storage_dir = base_dir / "data" / "extracted"
        
        self.storage_dir = Path(storage_dir)
        self.facts_dir = self.storage_dir / "facts"
        self.facts_dir.mkdir(parents=True, exist_ok=True)
        
        # In-memory cache for Phase 0
        self._facts_cache: Dict[str, FactMetric] = {}
        self._load_facts()

    def _load_facts(self) -> None:
        """Load facts from JSON files."""
        try:
            # Load facts organized by domain/institution/fiscal_year
            for domain_dir in self.facts_dir.iterdir():
                if not domain_dir.is_dir():
                    continue
                
                try:
                    domain = MetricDomain(domain_dir.name)
                except ValueError:
                    continue
                
                for inst_dir in domain_dir.iterdir():
                    if not inst_dir.is_dir():
                        continue
                    
                    for year_dir in inst_dir.iterdir():
                        if not year_dir.is_dir():
                            continue
                        
                        metrics_file = year_dir / "metrics.json"
                        if metrics_file.exists():
                            try:
                                with open(metrics_file, "r", encoding="utf-8") as f:
                                    facts_data = json.load(f)
                                    for fact_data in facts_data.get("facts", []):
                                        try:
                                            fact = FactMetric(**fact_data)
                                            self._facts_cache[fact.id] = fact
                                        except Exception as e:
                                            logger.error(f"Error loading fact {fact_data.get('id', 'unknown')}: {e}")
                            except Exception as e:
                                logger.error(f"Error loading facts from {metrics_file}: {e}")
            
            logger.info(f"Loaded {len(self._facts_cache)} facts from storage")
        except Exception as e:
            logger.error(f"Error loading facts: {e}", exc_info=True)

    def _save_fact_to_file(self, fact: FactMetric) -> None:
        """Save a fact to the appropriate JSON file."""
        try:
            # Organize by domain/institution_id/fiscal_year
            domain_dir = self.facts_dir / fact.domain.value
            domain_dir.mkdir(parents=True, exist_ok=True)
            
            # Extract fiscal_year from dimension_values
            fiscal_year = fact.dimension_values.get("fiscal_year")
            if not fiscal_year:
                fiscal_year = datetime.now().year
            
            inst_dir = domain_dir / fact.entity_id
            inst_dir.mkdir(parents=True, exist_ok=True)
            
            year_dir = inst_dir / str(fiscal_year)
            year_dir.mkdir(parents=True, exist_ok=True)
            
            metrics_file = year_dir / "metrics.json"
            
            # Load existing facts
            facts_data = {"facts": []}
            if metrics_file.exists():
                try:
                    with open(metrics_file, "r", encoding="utf-8") as f:
                        facts_data = json.load(f)
                except Exception:
                    facts_data = {"facts": []}
            
            # Update or add fact
            facts_list = facts_data.get("facts", [])
            fact_dict = fact.model_dump()
            fact_dict["extracted_at"] = fact.extracted_at.isoformat()
            if fact.validated_at:
                fact_dict["validated_at"] = fact.validated_at.isoformat()
            
            # Check if fact already exists
            existing_index = None
            for i, existing_fact in enumerate(facts_list):
                if existing_fact.get("id") == fact.id:
                    existing_index = i
                    break
            
            if existing_index is not None:
                facts_list[existing_index] = fact_dict
            else:
                facts_list.append(fact_dict)
            
            facts_data["facts"] = facts_list
            
            # Save back to file
            with open(metrics_file, "w", encoding="utf-8") as f:
                json.dump(facts_data, f, indent=2, ensure_ascii=False)
            
        except Exception as e:
            logger.error(f"Error saving fact to file: {e}", exc_info=True)

    def save_extracted_fact(self, fact: FactMetric) -> FactMetric:
        """Save an extracted metric fact."""
        if not fact.id:
            fact.id = f"fact-{uuid.uuid4().hex[:12]}"
        
        self._facts_cache[fact.id] = fact
        self._save_fact_to_file(fact)
        logger.debug(f"Saved fact {fact.id} for metric {fact.metric_id}")
        return fact

    def query_facts(
        self,
        metric_ids: Optional[List[str]] = None,
        entity_ids: Optional[List[str]] = None,
        domain: Optional[MetricDomain] = None,
        fiscal_years: Optional[List[int]] = None,
        fiscal_year_start: Optional[int] = None,
        fiscal_year_end: Optional[int] = None,
        include_pending: bool = False,
        limit: Optional[int] = None
    ) -> List[FactMetric]:
        """Query facts with filters."""
        results = []
        
        for fact in self._facts_cache.values():
            # Filter by metric_ids
            if metric_ids and fact.metric_id not in metric_ids:
                continue
            
            # Filter by entity_ids
            if entity_ids and fact.entity_id not in entity_ids:
                continue
            
            # Filter by domain
            if domain and fact.domain != domain:
                continue
            
            # Filter by fiscal year
            fact_fiscal_year = fact.dimension_values.get("fiscal_year")
            if fiscal_years and fact_fiscal_year not in fiscal_years:
                continue
            if fiscal_year_start and (not fact_fiscal_year or fact_fiscal_year < fiscal_year_start):
                continue
            if fiscal_year_end and (not fact_fiscal_year or fact_fiscal_year > fiscal_year_end):
                continue
            
            # Filter by validation status
            if not include_pending and fact.validation_status == "pending_review":
                continue
            
            results.append(fact)
        
        # Sort by extracted_at descending
        results.sort(key=lambda x: x.extracted_at, reverse=True)
        
        if limit:
            results = results[:limit]
        
        return results

    def get_metrics_by_domain(self, domain: MetricDomain) -> List[FactMetric]:
        """Get all facts for a specific domain."""
        return [f for f in self._facts_cache.values() if f.domain == domain]

    def compare_metrics(
        self,
        metric_ids: List[str],
        entity_ids: Optional[List[str]] = None,
        fiscal_years: Optional[List[int]] = None,
        group_by: Optional[List[str]] = None
    ) -> List[ComparisonResult]:
        """Compare metrics across entities and time."""
        facts = self.query_facts(
            metric_ids=metric_ids,
            entity_ids=entity_ids,
            fiscal_years=fiscal_years
        )
        
        # Group by metric_id
        results = []
        metrics_dict: Dict[str, List[FactMetric]] = {}
        
        for fact in facts:
            if fact.metric_id not in metrics_dict:
                metrics_dict[fact.metric_id] = []
            metrics_dict[fact.metric_id].append(fact)
        
        for metric_id, metric_facts in metrics_dict.items():
            if not metric_facts:
                continue
            
            # Get metric name from first fact (would normally come from glossary)
            metric_name = metric_facts[0].metric_id.replace("metric-", "").replace("-", " ").title()
            domain = metric_facts[0].domain
            
            # Aggregate if group_by specified
            aggregated = None
            if group_by:
                aggregated = self._aggregate_facts(metric_facts, group_by)
            
            # Calculate comparison stats
            comparison_stats = self._calculate_stats(metric_facts)
            
            result = ComparisonResult(
                metric_id=metric_id,
                metric_name=metric_name,
                domain=domain,
                data_points=metric_facts,
                aggregated=aggregated,
                comparison_stats=comparison_stats
            )
            results.append(result)
        
        return results

    def _aggregate_facts(self, facts: List[FactMetric], group_by: List[str]) -> Dict[str, Any]:
        """Aggregate facts by specified dimensions."""
        aggregated = {}
        
        for fact in facts:
            key_parts = []
            for dim in group_by:
                value = fact.dimension_values.get(dim, "unknown")
                key_parts.append(f"{dim}:{value}")
            
            key = "|".join(key_parts)
            
            if key not in aggregated:
                aggregated[key] = {
                    "count": 0,
                    "sum": 0.0,
                    "values": [],
                    "dimensions": {dim: fact.dimension_values.get(dim) for dim in group_by}
                }
            
            aggregated[key]["count"] += 1
            aggregated[key]["sum"] += fact.value
            aggregated[key]["values"].append(fact.value)
        
        # Calculate averages
        for key, data in aggregated.items():
            if data["count"] > 0:
                data["average"] = data["sum"] / data["count"]
                data["min"] = min(data["values"])
                data["max"] = max(data["values"])
        
        return aggregated

    def _calculate_stats(self, facts: List[FactMetric]) -> Dict[str, Any]:
        """Calculate statistics for a set of facts."""
        if not facts:
            return {}
        
        values = [f.value for f in facts]
        
        return {
            "count": len(facts),
            "sum": sum(values),
            "average": sum(values) / len(values) if values else 0,
            "min": min(values) if values else 0,
            "max": max(values) if values else 0,
            "entities": len(set(f.entity_id for f in facts)),
            "fiscal_years": sorted(set(f.dimension_values.get("fiscal_year") for f in facts if f.dimension_values.get("fiscal_year")))
        }

    def get_timeseries(
        self,
        metric_id: str,
        entity_id: Optional[str] = None,
        fiscal_year_start: Optional[int] = None,
        fiscal_year_end: Optional[int] = None
    ) -> List[FactMetric]:
        """Get time series data for a metric."""
        return self.query_facts(
            metric_ids=[metric_id],
            entity_ids=[entity_id] if entity_id else None,
            fiscal_year_start=fiscal_year_start,
            fiscal_year_end=fiscal_year_end
        )


# Global instance
_data_storage: Optional[DataStorage] = None


def get_data_storage() -> DataStorage:
    """Get the global data storage instance."""
    global _data_storage
    if _data_storage is None:
        _data_storage = DataStorage()
    return _data_storage
