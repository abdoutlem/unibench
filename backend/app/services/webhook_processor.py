"""Service for processing n8n webhook data with AI."""

import logging
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, date

from app.models.webhook import N8NObservation
from app.models.glossary import GlossaryMetric, DimensionDefinition
from app.db.database import get_db_session, init_db
from app.db.models import (
    MetricDefinition as DBMetricDefinition,
    MetricMappingConfig as DBMetricMappingConfig,
    Dimension as DBDimension,
    Entity as DBEntity,
    ValueType,
    AggregationType
)
from app.services.glossary_loader_db import get_glossary_loader_db
from app.core.config import settings

logger = logging.getLogger(__name__)


class WebhookProcessor:
    """Processes n8n webhook data with AI assistance."""

    def __init__(self):
        """Initialize webhook processor."""
        self.glossary_loader = get_glossary_loader_db()
        self.glossary_loader.load_all()
        self._openai_client = None

    @property
    def openai_client(self):
        """Lazy load OpenAI client."""
        if self._openai_client is None:
            try:
                import openai
                api_key = settings.openai_api_key
                if not api_key:
                    raise ValueError("OPENAI_API_KEY not configured. Please set it in .env file.")
                self._openai_client = openai.OpenAI(api_key=api_key)
            except ImportError:
                raise ImportError("openai package not installed")
        return self._openai_client

    def get_mapping_config(self, raw_metric_name: str) -> Optional[DBMetricMappingConfig]:
        """Get pre-configured mapping for raw metric name."""
        db = get_db_session()
        try:
            mapping = db.query(DBMetricMappingConfig).filter(
                DBMetricMappingConfig.raw_metric_name == raw_metric_name
            ).first()
            return mapping
        finally:
            db.close()

    def map_metric_name(self, raw_name: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Map raw metric name to canonical metric_id using AI with full context."""
        # First check for pre-configured mapping
        mapping = self.get_mapping_config(raw_name)
        if mapping:
            logger.info(f"Using pre-configured mapping: {raw_name} -> {mapping.metric_id}")
            return mapping.metric_id

        # Use AI to map
        try:
            # Get all available metrics
            all_metrics = self.glossary_loader.get_all_metrics()
            metrics_list = []
            for metric in all_metrics:
                metrics_list.append({
                    "id": metric.id,
                    "name": metric.canonical_name,
                    "description": metric.description,
                    "domain": metric.domain.value,
                    "unit": metric.unit,
                    "variations": metric.semantic_variations
                })

            # Build context string if available
            context_str = ""
            if context:
                context_parts = []
                if context.get("dimensions"):
                    context_parts.append(f"Dimensions: {json.dumps(context.get('dimensions'))}")
                if context.get("aggregation"):
                    context_parts.append(f"Aggregation: {context.get('aggregation')}")
                if context.get("value"):
                    context_parts.append(f"Value: {context.get('value')}")
                if context.get("entity_id"):
                    context_parts.append(f"Entity: {context.get('entity_id')}")
                if context_parts:
                    context_str = f"\n\nAdditional context:\n" + "\n".join(context_parts)

            # Build comprehensive prompt for AI
            prompt = f"""You are a data mapping and contextualization assistant. Your task is to understand a raw metric from an external data source and map it to the most appropriate canonical metric from the glossary.

RAW METRIC TO MAP:
- Name: "{raw_name}"{context_str}

AVAILABLE CANONICAL METRICS IN GLOSSARY:
{json.dumps(metrics_list, indent=2)}

YOUR TASK:
1. Analyze the raw metric name "{raw_name}" and understand what it measures
2. Consider the context provided (dimensions, aggregation, value) to better understand the metric's meaning
3. Find the best matching canonical metric from the glossary that represents the same or very similar concept
4. Consider:
   - Semantic variations and synonyms
   - Domain context (finance, students, faculty, research, operations)
   - Unit of measurement
   - The metric's purpose and meaning
5. If you find a strong match (confidence > 0.7), return the metric_id
6. If no good match exists, return "null"

Respond with JSON in this format:
{{
    "metric_id": "metric-id-here" or null,
    "confidence": 0.0-1.0,
    "reason": "brief explanation of why this metric matches or why no match was found",
    "suggested_canonical_name": "if no match, suggest a canonical name for this metric"
}}"""

            response = self.openai_client.chat.completions.create(
                model=settings.default_ai_model if "gpt" in settings.default_ai_model else "gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a precise data mapping assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )

            response_text = response.choices[0].message.content
            # Parse JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result = json.loads(response_text.strip())
            metric_id = result.get("metric_id")
            confidence = result.get("confidence", 0.0)
            reason = result.get("reason", "")
            suggested_name = result.get("suggested_canonical_name")

            if metric_id and metric_id != "null" and confidence > 0.7:
                logger.info(f"AI mapped '{raw_name}' to '{metric_id}' (confidence: {confidence}, reason: {reason})")
                return metric_id
            else:
                if suggested_name:
                    logger.info(f"AI suggested canonical name '{suggested_name}' for '{raw_name}' (confidence: {confidence})")
                logger.warning(f"AI could not map '{raw_name}' to any canonical metric (confidence: {confidence}, reason: {reason})")
                return None

        except Exception as e:
            logger.error(f"Error mapping metric name with AI: {e}", exc_info=True)
            return None

    def validate_dimensions(
        self, 
        dimensions: Dict[str, str], 
        metric_id: str
    ) -> Dict[str, str]:
        """Validate dimension values against authorized values."""
        validated = {}
        glossary_metric = self.glossary_loader.get_metric(metric_id)
        
        if not glossary_metric:
            # If metric doesn't exist, accept all dimensions as-is
            return dimensions

        db = get_db_session()
        try:
            for dim_key, dim_value in dimensions.items():
                # Find dimension definition
                db_dim = db.query(DBDimension).filter(
                    DBDimension.dimension_name == dim_key
                ).first()

                if db_dim and db_dim.authorized_values:
                    # Check if value is in authorized list
                    authorized = db_dim.authorized_values
                    if isinstance(authorized, str):
                        try:
                            authorized = json.loads(authorized)
                        except:
                            authorized = []
                    
                    # Normalize for comparison
                    dim_value_lower = str(dim_value).strip().lower()
                    authorized_lower = [str(v).strip().lower() for v in authorized]
                    
                    if dim_value_lower in authorized_lower:
                        # Use canonical value from authorized list
                        canonical_value = next(
                            (v for v in authorized if str(v).strip().lower() == dim_value_lower),
                            dim_value
                        )
                        validated[dim_key] = canonical_value
                    else:
                        # Value not authorized - use AI to suggest correction
                        corrected = self._correct_dimension_value_with_ai(
                            dim_key, dim_value, authorized
                        )
                        if corrected:
                            validated[dim_key] = corrected
                            logger.warning(
                                f"Corrected dimension '{dim_key}' value '{dim_value}' to '{corrected}'"
                            )
                        else:
                            # Keep original but log warning
                            validated[dim_key] = dim_value
                            logger.warning(
                                f"Dimension '{dim_key}' value '{dim_value}' not in authorized values: {authorized}"
                            )
                else:
                    # No authorized values, accept as-is
                    validated[dim_key] = dim_value

        finally:
            db.close()

        return validated

    def _correct_dimension_value_with_ai(
        self, 
        dimension_name: str, 
        value: str, 
        authorized_values: List[str]
    ) -> Optional[str]:
        """Use AI to correct dimension value to match authorized values."""
        try:
            prompt = f"""You are a data validation assistant. A dimension value needs to be corrected to match authorized values.

Dimension name: "{dimension_name}"
Provided value: "{value}"
Authorized values: {json.dumps(authorized_values, indent=2)}

Instructions:
1. Find the best matching authorized value for "{value}"
2. Consider typos, case differences, and similar meanings
3. Return the exact authorized value if a match is found
4. Return "null" if no good match exists

Respond with JSON:
{{
    "corrected_value": "authorized-value-here" or null,
    "confidence": 0.0-1.0
}}"""

            response = self.openai_client.chat.completions.create(
                model=settings.default_ai_model if "gpt" in settings.default_ai_model else "gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a precise data validation assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200
            )

            response_text = response.choices[0].message.content
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result = json.loads(response_text.strip())
            corrected = result.get("corrected_value")
            
            if corrected and corrected != "null" and corrected in authorized_values:
                return corrected
            return None

        except Exception as e:
            logger.error(f"Error correcting dimension value with AI: {e}", exc_info=True)
            return None

    def create_metric_from_raw(
        self, 
        raw_name: str, 
        unit: Optional[str] = None,
        aggregation: Optional[str] = None
    ) -> str:
        """Auto-create a new metric definition from raw metric name."""
        db = get_db_session()
        try:
            init_db()  # Ensure tables exist
            
            # Generate metric ID
            metric_id = f"metric-{raw_name.lower().replace(' ', '-').replace('_', '-')}"
            # Ensure unique
            existing = db.query(DBMetricDefinition).filter(
                DBMetricDefinition.metric_id == metric_id
            ).first()
            if existing:
                metric_id = f"{metric_id}-{datetime.utcnow().timestamp()}"

            # Determine value type from unit
            value_type = ValueType.NUMBER
            if unit:
                if "percentage" in unit.lower() or "%" in unit:
                    value_type = ValueType.PERCENTAGE
                elif "count" in unit.lower() or unit.lower() in ["integer", "int"]:
                    value_type = ValueType.INTEGER

            # Determine aggregation
            aggregation_type = AggregationType.SUM
            if aggregation:
                agg_lower = aggregation.lower()
                if "average" in agg_lower or "avg" in agg_lower or "mean" in agg_lower:
                    aggregation_type = AggregationType.AVG
                elif "count" in agg_lower:
                    aggregation_type = AggregationType.COUNT
                elif "min" in agg_lower or "minimum" in agg_lower:
                    aggregation_type = AggregationType.MIN
                elif "max" in agg_lower or "maximum" in agg_lower:
                    aggregation_type = AggregationType.MAX

            # Create metric
            new_metric = DBMetricDefinition(
                metric_id=metric_id,
                canonical_name=raw_name,
                description=f"Auto-created metric from n8n: {raw_name}",
                unit=unit or "number",
                value_type=value_type,
                default_aggregation=aggregation_type,
                category="operations",  # Default domain
                calculation_logic=aggregation or "No calculation logic specified",
                data_owner="n8n-automation",
                source="n8n-webhook",
                update_frequency="as-needed",
                version="1.0",
                effective_date=date.today(),
                is_active=1,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_metric)
            db.commit()

            logger.info(f"Auto-created metric: {metric_id} ({raw_name})")
            return metric_id

        except Exception as e:
            logger.error(f"Error creating metric from raw name: {e}", exc_info=True)
            db.rollback()
            raise
        finally:
            db.close()
