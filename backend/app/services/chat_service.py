"""Chat service – translates natural-language questions into ExploreRequest via ChatGPT."""

import json
import logging
import os
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import MetricDefinition, Entity, Dimension, MetricObservation
from app.models.analytics import ExploreRequest, ExploreFilters

logger = logging.getLogger(__name__)


def build_system_prompt(db: Session) -> str:
    """Dynamically build a system prompt containing DB metadata."""
    metrics = db.query(
        MetricDefinition.metric_id,
        MetricDefinition.canonical_name,
        MetricDefinition.unit,
        MetricDefinition.category,
    ).filter(MetricDefinition.is_active == 1).all()

    entities = db.query(Entity.entity_id, Entity.entity_name, Entity.entity_type).all()

    dimensions = db.query(Dimension.dimension_name).all()

    # Year range
    from sqlalchemy import func, extract
    min_year = db.query(func.min(extract("year", MetricObservation.observation_date))).scalar()
    max_year = db.query(func.max(extract("year", MetricObservation.observation_date))).scalar()

    metric_lines = "\n".join(
        f"  - id: {m.metric_id}, name: {m.canonical_name}, unit: {m.unit}, domain: {m.category}"
        for m in metrics
    )
    entity_lines = "\n".join(
        f"  - id: {e.entity_id}, name: {e.entity_name}, type: {e.entity_type}"
        for e in entities
    )
    dim_lines = ", ".join(d.dimension_name for d in dimensions)

    return f"""You are a data analytics assistant for the UniBench platform.
You translate natural-language questions into structured ExploreRequest JSON objects.

Available metrics:
{metric_lines}

Available entities (institutions):
{entity_lines}

Available dimensions for group_by: entity_id, fiscal_year, metric_id, {dim_lines}
Data available from fiscal year {min_year or 2015} to {max_year or 2024}.

Aggregation options: sum, average, min, max, count, none, latest

When the user asks a question, respond with a JSON block in this format:
```json
{{
  "explore_request": {{
    "metric_ids": ["metric-id-here"],
    "group_by": ["entity_id", "fiscal_year"],
    "filters": {{
      "entity_ids": [],
      "fiscal_year_start": null,
      "fiscal_year_end": null,
      "dimension_filters": {{}}
    }},
    "aggregation": "sum",
    "sort_by": "value",
    "sort_order": "desc",
    "limit": 500
  }},
  "suggested_chart_type": "line",
  "explanation": "Brief explanation of what this query does"
}}
```

Guidelines:
- Use "line" chart for trends over time (when fiscal_year is in group_by)
- Use "bar" chart for comparisons across entities
- Use "pie" for distribution/composition
- Use "table" when raw data is requested
- When the user says "all universities" or "all institutions", leave entity_ids empty (returns all)
- When the user asks about "trends" or "over time", include "fiscal_year" in group_by
- For percentage metrics (retention_rate, grad_rate), use "average" aggregation, not "sum"
- Always include a clear explanation

Respond ONLY with the JSON block and a short human-readable explanation. Do not include anything else."""


def parse_explore_request(ai_response: str) -> tuple[Optional[dict], Optional[str], Optional[str], float]:
    """Extract explore_request, chart type, and explanation from AI response.

    Returns (explore_request_dict, chart_type, explanation, confidence).
    """
    # Try to find JSON block
    json_str = None
    if "```json" in ai_response:
        start = ai_response.index("```json") + 7
        end = ai_response.index("```", start)
        json_str = ai_response[start:end].strip()
    elif "```" in ai_response:
        start = ai_response.index("```") + 3
        end = ai_response.index("```", start)
        json_str = ai_response[start:end].strip()
    else:
        # Try to parse the whole response as JSON
        json_str = ai_response.strip()

    if not json_str:
        return None, None, ai_response, 0.0

    try:
        parsed = json.loads(json_str)
        explore_req = parsed.get("explore_request")
        chart_type = parsed.get("suggested_chart_type", "bar")
        explanation = parsed.get("explanation", "")
        return explore_req, chart_type, explanation, 0.9
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Failed to parse AI response as JSON: {e}")
        return None, None, ai_response, 0.0


async def execute_chat_query(
    message: str,
    conversation_history: list[dict],
    db: Session,
) -> dict:
    """Orchestrate: build prompt → call ChatGPT → parse → execute explore."""
    try:
        import openai
    except ImportError:
        return {
            "reply": "OpenAI SDK not installed. Install with: pip install openai",
            "confidence": 0.0,
        }

    api_key = os.environ.get("OPENAI_API_KEY") or None
    if not api_key:
        # Try loading from .env
        from app.core.config import settings
        api_key = settings.openai_api_key

    if not api_key:
        return {
            "reply": "OpenAI API key not configured. Set OPENAI_API_KEY in .env.",
            "confidence": 0.0,
        }

    system_prompt = build_system_prompt(db)

    # Build messages for ChatGPT (include system message in messages array)
    messages = [{"role": "system", "content": system_prompt}]
    for h in conversation_history[-10:]:  # keep last 10 turns
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})

    client = openai.OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            max_tokens=1024,
            messages=messages,
        )
        ai_text = response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}", exc_info=True)
        return {"reply": f"AI service error: {str(e)}", "confidence": 0.0}

    # Parse the response
    explore_dict, chart_type, explanation, confidence = parse_explore_request(ai_text)

    result: dict = {
        "reply": explanation or ai_text,
        "confidence": confidence,
    }

    if explore_dict:
        result["explore_request"] = explore_dict
        result["suggested_chart_type"] = chart_type

        # Execute the query
        try:
            from app.api.analytics import explore_metrics as _explore
            req = ExploreRequest(**explore_dict)
            explore_result = await _explore(req, db)
            result["explore_result"] = explore_result.model_dump()
        except Exception as e:
            logger.warning(f"Failed to execute parsed query: {e}")
            result["reply"] += f"\n\n(Query parsed but execution failed: {e})"

    return result
