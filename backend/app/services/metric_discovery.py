"""Service for discovering and grouping metrics from observations."""

import logging
import json
from typing import List, Dict, Any, Optional
from collections import defaultdict
from sqlalchemy import func, distinct

from app.db.database import get_db_session, init_db
from app.db.models import (
    MetricObservation as DBMetricObservation,
    MetricDefinition as DBMetricDefinition,
    MetricMappingConfig as DBMetricMappingConfig,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class MetricDiscoveryService:
    """Discovers and groups metrics from observations."""

    def __init__(self):
        """Initialize discovery service."""
        self._openai_client = None

    @property
    def openai_client(self):
        """Lazy load OpenAI client."""
        if self._openai_client is None:
            try:
                import openai
                api_key = settings.openai_api_key
                if not api_key:
                    logger.warning("OPENAI_API_KEY not configured. Semantic grouping will use fallback.")
                    return None
                self._openai_client = openai.OpenAI(api_key=api_key)
            except ImportError:
                logger.warning("openai package not installed. Semantic grouping will use fallback.")
                return None
        return self._openai_client

    def get_discovered_metrics(self) -> List[Dict[str, Any]]:
        """Get all unique raw metric names from unmapped observations."""
        init_db()
        db = get_db_session()
        try:
            from app.db.models import UnmappedObservation as DBUnmappedObservation
            
            # Get all unmapped observations grouped by raw_metric_name
            unmapped_obs = db.query(
                DBUnmappedObservation.raw_metric_name,
                func.count(DBUnmappedObservation.observation_id).label('count'),
                func.min(DBUnmappedObservation.created_at).label('first_seen'),
                func.max(DBUnmappedObservation.created_at).label('last_seen'),
                func.avg(DBUnmappedObservation.value).label('avg_value'),
                func.min(DBUnmappedObservation.value).label('min_value'),
                func.max(DBUnmappedObservation.value).label('max_value')
            ).group_by(DBUnmappedObservation.raw_metric_name).all()

            discovered = []
            for obs in unmapped_obs:
                # Get sample observation for dimensions and aggregation
                sample = db.query(DBUnmappedObservation).filter(
                    DBUnmappedObservation.raw_metric_name == obs.raw_metric_name
                ).first()
                
                discovered.append({
                    "raw_metric_name": obs.raw_metric_name,
                    "canonical_name": obs.raw_metric_name,  # Use raw name as canonical for now
                    "description": f"Discovered metric: {obs.raw_metric_name}",
                    "unit": sample.unit or "number",
                    "category": "operations",  # Default, will be determined when accepted
                    "observation_count": obs.count,
                    "first_seen": obs.first_seen.isoformat() if obs.first_seen else None,
                    "last_seen": obs.last_seen.isoformat() if obs.last_seen else None,
                    "is_auto_created": False,  # Not auto-created, just unmapped
                    "source": "n8n-webhook",
                    "sample_dimensions": sample.dimensions if sample else {},
                    "sample_aggregation": sample.aggregation if sample else "",
                    "value_stats": {
                        "avg": float(obs.avg_value) if obs.avg_value else None,
                        "min": float(obs.min_value) if obs.min_value else None,
                        "max": float(obs.max_value) if obs.max_value else None
                    }
                })

            return discovered
        finally:
            db.close()

    def group_metrics_semantically(self, metrics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Group metrics semantically using AI."""
        if not metrics:
            return []

        # Check if OpenAI client is available
        if not self.openai_client:
            logger.warning("OpenAI client not available. Using fallback grouping.")
            return self._fallback_grouping(metrics)

        try:
            # Prepare metrics list for AI
            metrics_list = [
                {
                    "raw_name": m["raw_metric_name"],
                    "name": m["canonical_name"],
                    "description": m.get("description", ""),
                    "count": m.get("observation_count", 0),
                    "sample_dimensions": m.get("sample_dimensions", {}),
                    "sample_aggregation": m.get("sample_aggregation", ""),
                    "value_stats": m.get("value_stats", {})
                }
                for m in metrics
            ]

            prompt = f"""You are a data governance assistant. Your task is to group similar metrics semantically.

Here are discovered metrics from data sources:
{json.dumps(metrics_list, indent=2)}

Instructions:
1. Group metrics that measure the same or very similar concepts
2. For each group, suggest a canonical metric name that best represents the group
3. Consider synonyms, variations, and related concepts
4. A group should have 1-5 metrics typically
5. Some metrics might not group with others (standalone)

Return JSON in this format:
{{
    "groups": [
        {{
            "canonical_name": "Suggested canonical name for this group",
            "description": "What this metric group measures",
            "unit": "suggested unit (count, currency, percentage, etc.)",
            "category": "suggested category (finance, operations, students, etc.)",
            "metric_names": ["raw-metric-name-1", "raw-metric-name-2"],
            "confidence": 0.0-1.0
        }}
    ],
    "standalone": [
        {{
            "raw_metric_name": "raw-metric-name",
            "canonical_name": "Suggested canonical name",
            "description": "What this metric measures",
            "unit": "suggested unit",
            "category": "suggested category"
        }}
    ]
}}"""

            response = self.openai_client.chat.completions.create(
                model=settings.default_ai_model if "gpt" in settings.default_ai_model else "gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a precise data governance assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )

            response_text = response.choices[0].message.content
            # Parse JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result = json.loads(response_text.strip())
            
            # Combine groups and standalone into unified format
            groups = []
            
            # Process grouped metrics
            for group in result.get("groups", []):
                # Get full metric details by raw_metric_name
                group_metrics = []
                for raw_name in group.get("metric_names", []):
                    metric = next((m for m in metrics if m["raw_metric_name"] == raw_name), None)
                    if metric:
                        group_metrics.append(metric)
                
                if group_metrics:
                    groups.append({
                        "group_id": f"group-{len(groups) + 1}",
                        "canonical_name": group.get("canonical_name", ""),
                        "description": group.get("description", ""),
                        "unit": group.get("unit", "number"),
                        "category": group.get("category", "operations"),
                        "confidence": group.get("confidence", 0.8),
                        "metrics": group_metrics,
                        "total_observations": sum(m.get("observation_count", 0) for m in group_metrics)
                    })
            
            # Process standalone metrics
            for standalone in result.get("standalone", []):
                metric = next((m for m in metrics if m["raw_metric_name"] == standalone.get("raw_metric_name")), None)
                if metric:
                    groups.append({
                        "group_id": f"group-{len(groups) + 1}",
                        "canonical_name": standalone.get("canonical_name", metric["canonical_name"]),
                        "description": standalone.get("description", metric.get("description", "")),
                        "unit": standalone.get("unit", metric.get("unit", "number")),
                        "category": standalone.get("category", metric.get("category", "operations")),
                        "confidence": 1.0,
                        "metrics": [metric],
                        "total_observations": metric.get("observation_count", 0)
                    })

            logger.info(f"Grouped {len(metrics)} metrics into {len(groups)} semantic groups")
            return groups

        except Exception as e:
            logger.error(f"Error grouping metrics with AI: {e}", exc_info=True)
            # Fallback: return each metric as its own group
            return [
                {
                    "group_id": f"group-{i+1}",
                    "canonical_name": m["canonical_name"],
                    "description": m.get("description", ""),
                    "unit": m.get("unit", "number"),
                    "category": m.get("category", "operations"),
                    "confidence": 0.5,
                    "metrics": [m],
                    "total_observations": m.get("observation_count", 0)
                }
                for i, m in enumerate(metrics)
            ]

    def _fallback_grouping(self, metrics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fallback grouping when AI is not available - simple name-based grouping."""
        from collections import defaultdict
        from rapidfuzz import fuzz, process
        
        # Group by similar names
        groups_dict = defaultdict(list)
        processed = set()
        
        for metric in metrics:
            if metric["metric_id"] in processed:
                continue
            
            # Find similar metrics
            similar = [metric]
            for other in metrics:
                if other["metric_id"] in processed or other["metric_id"] == metric["metric_id"]:
                    continue
                
                # Check name similarity
                similarity = fuzz.ratio(
                    metric["canonical_name"].lower(),
                    other["canonical_name"].lower()
                )
                
                if similarity > 70:  # 70% similarity threshold
                    similar.append(other)
                    processed.add(other["metric_id"])
            
            processed.add(metric["metric_id"])
            
            # Create group
            canonical_name = metric["canonical_name"]  # Use first metric's name
            groups_dict[canonical_name] = similar
        
        # Convert to list format
        groups = []
        for i, (canonical_name, group_metrics) in enumerate(groups_dict.items()):
            groups.append({
                "group_id": f"group-{i+1}",
                "canonical_name": canonical_name,
                "description": group_metrics[0].get("description", ""),
                "unit": group_metrics[0].get("unit", "number"),
                "category": group_metrics[0].get("category", "operations"),
                "confidence": 0.6,  # Lower confidence for fallback
                "metrics": group_metrics,
                "total_observations": sum(m.get("observation_count", 0) for m in group_metrics)
            })
        
        return groups
