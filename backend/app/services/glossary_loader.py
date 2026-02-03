"""Service for loading and managing glossary definitions."""

import yaml
import logging
from pathlib import Path
from typing import Dict, List, Optional
from app.models.glossary import GlossaryMetric, EntityDefinition, DimensionDefinition, MetricDomain

logger = logging.getLogger(__name__)


class GlossaryLoader:
    """Loads and caches glossary definitions from YAML files."""

    def __init__(self, glossary_dir: Optional[Path] = None):
        """Initialize glossary loader."""
        if glossary_dir is None:
            # Default to app/data/glossary relative to this file
            base_dir = Path(__file__).parent.parent
            glossary_dir = base_dir / "data" / "glossary"
        
        self.glossary_dir = Path(glossary_dir)
        self._metrics_cache: Dict[str, GlossaryMetric] = {}
        self._entities_cache: Dict[str, EntityDefinition] = {}
        self._dimensions_cache: Dict[str, DimensionDefinition] = {}
        self._loaded = False

    def _dbg(self, hypothesis_id: str, location: str, message: str, data: dict) -> None:
        """Write NDJSON debug logs (debug mode)."""
        try:
            import json, time
            payload = {
                "sessionId": "debug-session",
                "runId": "pre-fix",
                "hypothesisId": hypothesis_id,
                "location": location,
                "message": message,
                "data": data,
                "timestamp": int(time.time() * 1000),
            }
            with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(payload) + "\n")
        except Exception:
            pass

    def load_all(self) -> None:
        """Load all glossary definitions from YAML files."""
        if self._loaded:
            return

        try:
            # Load metrics
            metrics_file = self.glossary_dir / "metrics.yaml"
            if metrics_file.exists():
                # #region agent log
                self._dbg(
                    "H1",
                    "backend/app/services/glossary_loader.py:load_all:metrics_open",
                    "Opening metrics.yaml",
                    {"path": str(metrics_file)},
                )
                # #endregion
                with open(metrics_file, "r", encoding="utf-8") as f:
                    try:
                        data = yaml.safe_load(f)
                    except Exception as e:
                        # #region agent log
                        self._dbg(
                            "H1",
                            "backend/app/services/glossary_loader.py:load_all:metrics_safe_load_error",
                            "yaml.safe_load failed for metrics.yaml",
                            {"error": str(e)},
                        )
                        # #endregion
                        # If a legacy file contains python/object tags (unsafe), load it unsafely,
                        # normalize to safe primitives, and rewrite it back to a safe YAML form.
                        try:
                            f.seek(0)
                            unsafe_data = yaml.load(f, Loader=yaml.UnsafeLoader)  # noqa: S506
                            # #region agent log
                            self._dbg(
                                "H4",
                                "backend/app/services/glossary_loader.py:load_all:metrics_unsafe_load_ok",
                                "yaml.UnsafeLoader succeeded; sanitizing and rewriting metrics.yaml",
                                {
                                    "has_metrics_key": isinstance(unsafe_data, dict) and "metrics" in unsafe_data,
                                    "type": str(type(unsafe_data)),
                                },
                            )
                            # #endregion
                            safe_data = {"metrics": []}
                            raw_metrics = []
                            if isinstance(unsafe_data, dict):
                                raw_metrics = unsafe_data.get("metrics", []) or []
                            for m in raw_metrics:
                                if not isinstance(m, dict):
                                    continue
                                # normalize domain to string
                                domain_val = m.get("domain")
                                if isinstance(domain_val, MetricDomain):
                                    m["domain"] = domain_val.value
                                elif domain_val is not None:
                                    m["domain"] = str(domain_val)
                                safe_data["metrics"].append(m)

                            # Rewrite to safe YAML
                            with open(metrics_file, "w", encoding="utf-8") as wf:
                                yaml.safe_dump(
                                    safe_data,
                                    wf,
                                    default_flow_style=False,
                                    sort_keys=False,
                                    allow_unicode=True,
                                )
                            data = safe_data
                        except Exception as e2:
                            # #region agent log
                            self._dbg(
                                "H4",
                                "backend/app/services/glossary_loader.py:load_all:metrics_unsafe_load_failed",
                                "UnsafeLoader remediation failed",
                                {"error": str(e2)},
                            )
                            # #endregion
                            raise
                    for metric_data in data.get("metrics", []):
                        try:
                            # #region agent log
                            self._dbg(
                                "H2",
                                "backend/app/services/glossary_loader.py:load_all:metric_item",
                                "Loading metric item",
                                {
                                    "id": metric_data.get("id"),
                                    "domain_type": str(type(metric_data.get("domain"))),
                                    "domain_value": str(metric_data.get("domain")),
                                },
                            )
                            # #endregion
                            metric = GlossaryMetric(**metric_data)
                            self._metrics_cache[metric.id] = metric
                        except Exception as e:
                            logger.error(f"Error loading metric {metric_data.get('id', 'unknown')}: {e}")
                logger.info(f"Loaded {len(self._metrics_cache)} metrics from glossary")
            else:
                logger.warning(f"Metrics file not found: {metrics_file}")

            # Load entities
            entities_file = self.glossary_dir / "entities.yaml"
            if entities_file.exists():
                with open(entities_file, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    for entity_data in data.get("entities", []):
                        try:
                            entity = EntityDefinition(**entity_data)
                            self._entities_cache[entity.id] = entity
                        except Exception as e:
                            logger.error(f"Error loading entity {entity_data.get('id', 'unknown')}: {e}")
                logger.info(f"Loaded {len(self._entities_cache)} entities from glossary")
            else:
                logger.warning(f"Entities file not found: {entities_file}")

            # Load dimensions
            dimensions_file = self.glossary_dir / "dimensions.yaml"
            if dimensions_file.exists():
                with open(dimensions_file, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    for dimension_data in data.get("dimensions", []):
                        try:
                            dimension = DimensionDefinition(**dimension_data)
                            self._dimensions_cache[dimension.id] = dimension
                        except Exception as e:
                            logger.error(f"Error loading dimension {dimension_data.get('id', 'unknown')}: {e}")
                logger.info(f"Loaded {len(self._dimensions_cache)} dimensions from glossary")
            else:
                logger.warning(f"Dimensions file not found: {dimensions_file}")

            self._loaded = True
        except Exception as e:
            logger.error(f"Error loading glossary: {e}", exc_info=True)
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

    def get_entity(self, entity_id: str) -> Optional[EntityDefinition]:
        """Get an entity definition by ID."""
        if not self._loaded:
            self.load_all()
        return self._entities_cache.get(entity_id)

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
        """Reload glossary definitions from files."""
        self._loaded = False
        self._metrics_cache.clear()
        self._entities_cache.clear()
        self._dimensions_cache.clear()
        self.load_all()

    def save_metric(self, metric: GlossaryMetric) -> bool:
        """Save a metric to the YAML file."""
        try:
            import yaml
            from datetime import datetime
            
            metrics_file = self.glossary_dir / "metrics.yaml"

            # #region agent log
            self._dbg(
                "H3",
                "backend/app/services/glossary_loader.py:save_metric:entry",
                "Saving metric",
                {
                    "id": getattr(metric, "id", None),
                    "domain_type": str(type(getattr(metric, "domain", None))),
                    "domain_value": str(getattr(metric, "domain", None)),
                    "metrics_file": str(metrics_file),
                },
            )
            # #endregion
            
            # Load existing metrics
            if metrics_file.exists():
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f) or {}
            else:
                data = {"metrics": []}
            
            metrics_list = data.get("metrics", [])
            
            # Update metric's updated_at timestamp
            metric.updated_at = datetime.utcnow()
            
            # Convert metric to JSON-safe primitives (Enum -> value, datetime -> ISO)
            metric_dict = metric.model_dump(mode="json")
            # Ensure domain is a plain string (avoid !!python/object tags)
            if isinstance(metric_dict.get("domain"), dict) or not isinstance(metric_dict.get("domain"), str):
                domain_val = getattr(metric, "domain", None)
                metric_dict["domain"] = domain_val.value if isinstance(domain_val, MetricDomain) else str(domain_val)
            
            # Find and update existing metric, or add new one
            found = False
            for i, existing_metric in enumerate(metrics_list):
                if existing_metric.get("id") == metric.id:
                    metrics_list[i] = metric_dict
                    found = True
                    break
            
            if not found:
                metrics_list.append(metric_dict)
            
            data["metrics"] = metrics_list
            
            # Save back to file
            with open(metrics_file, "w", encoding="utf-8") as f:
                yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

            # #region agent log
            self._dbg(
                "H3",
                "backend/app/services/glossary_loader.py:save_metric:written",
                "Wrote metrics.yaml via yaml.dump",
                {
                    "id": metric.id,
                    "domain_dumped_type": str(type(metric_dict.get("domain"))),
                    "domain_dumped_value": str(metric_dict.get("domain")),
                },
            )
            # #endregion
            
            # Update cache immediately
            self._metrics_cache[metric.id] = metric
            
            logger.info(f"Metric saved to glossary: {metric.id}")
            return True
        except Exception as e:
            logger.error(f"Error saving metric to glossary: {e}", exc_info=True)
            return False

    def save_dimension(self, dimension: DimensionDefinition) -> bool:
        """Save a dimension definition to the YAML file."""
        try:
            import yaml
            from datetime import datetime
            
            dimensions_file = self.glossary_dir / "dimensions.yaml"
            
            # Load existing dimensions
            if dimensions_file.exists():
                with open(dimensions_file, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f) or {}
            else:
                data = {"dimensions": []}
            
            dimensions_list = data.get("dimensions", [])
            
            # Convert dimension to dict
            dimension_dict = dimension.model_dump(mode="json")
            # Handle None values properly for YAML
            if dimension_dict.get("values") is None:
                dimension_dict["values"] = None
            
            # Find and update existing dimension, or add new one
            found = False
            for i, existing_dim in enumerate(dimensions_list):
                if existing_dim.get("id") == dimension.id:
                    dimensions_list[i] = dimension_dict
                    found = True
                    break
            
            if not found:
                dimensions_list.append(dimension_dict)
            
            data["dimensions"] = dimensions_list
            
            # Save back to file
            with open(dimensions_file, "w", encoding="utf-8") as f:
                yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            
            # Update cache immediately
            self._dimensions_cache[dimension.id] = dimension
            
            logger.info(f"Dimension saved to glossary: {dimension.id}")
            return True
        except Exception as e:
            logger.error(f"Error saving dimension to glossary: {e}", exc_info=True)
            return False


# Global instance
_glossary_loader: Optional[GlossaryLoader] = None


def get_glossary_loader() -> GlossaryLoader:
    """Get the global glossary loader instance."""
    global _glossary_loader
    if _glossary_loader is None:
        _glossary_loader = GlossaryLoader()
    return _glossary_loader
