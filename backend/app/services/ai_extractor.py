"""AI-based extraction service."""

import json
import logging
from typing import Optional, List
from dataclasses import dataclass

from app.models import (
    ExtractionRule,
    AIConfig,
    ExtractionSource,
    GlossaryMetric,
)
from app.core.config import settings
from app.services.glossary_loader import GlossaryLoader

logger = logging.getLogger(__name__)


@dataclass
class AIExtractionResult:
    """Result from AI extraction with structured entities, dimensions, and metrics."""
    value: Optional[float]
    raw_text: str
    confidence: float
    fiscal_year: Optional[int]
    notes: Optional[str]
    source: ExtractionSource
    # Structured data fields
    entity_type: Optional[str] = None
    entity_name: Optional[str] = None
    entity_id: Optional[str] = None
    dimensions: Optional[dict] = None
    metric_name: Optional[str] = None
    unit: Optional[str] = None


class AIExtractor:
    """Extracts data using AI models (Claude or GPT)."""

    def __init__(self, config: Optional[AIConfig] = None, glossary_loader: Optional[GlossaryLoader] = None):
        self.config = config or AIConfig()
        self.glossary_loader = glossary_loader
        self._anthropic_client = None
        self._openai_client = None

    @property
    def anthropic_client(self):
        """Lazy load Anthropic client."""
        if self._anthropic_client is None:
            try:
                import anthropic
                api_key = settings.anthropic_api_key
                if not api_key:
                    raise ValueError("ANTHROPIC_API_KEY not configured. Please set it in .env file.")
                self._anthropic_client = anthropic.Anthropic(
                    api_key=api_key
                )
            except ImportError:
                raise ImportError("anthropic package not installed")
        return self._anthropic_client

    @property
    def openai_client(self):
        """Lazy load OpenAI client."""
        if self._openai_client is None:
            try:
                import openai
                api_key = settings.openai_api_key
                if not api_key:
                    raise ValueError("OPENAI_API_KEY not configured. Please set it in .env file.")
                self._openai_client = openai.OpenAI(
                    api_key=api_key
                )
            except ImportError:
                raise ImportError("openai package not installed")
        return self._openai_client

    async def extract(
        self,
        text: str,
        rule: ExtractionRule,
        chunk_size: int = 8000,
        glossary_metric: Optional[GlossaryMetric] = None
    ) -> list[AIExtractionResult]:
        """Extract values from text using AI with optional glossary context."""
        results = []

        # Build variations string for the prompt
        variations_text = self._format_variations(rule)
        
        # Get glossary metric if available
        if not glossary_metric and self.glossary_loader:
            glossary_metric = self.glossary_loader.get_metric(rule.target_metric_id)

        # Chunk text if too long
        chunks = self._chunk_text(text, chunk_size)

        for chunk_idx, chunk in enumerate(chunks):
            prompt = self._build_prompt(rule, chunk, variations_text, glossary_metric)

            # Log the full prompt for debugging
            logger.info("=" * 80)
            logger.info(f"AI EXTRACTION PROMPT (Async) - Chunk {chunk_idx + 1}/{len(chunks)}")
            logger.info(f"Provider: {self.config.provider}, Model: {self.config.model}")
            logger.info(f"Rule ID: {rule.id}, Metric: {rule.target_metric_name} ({rule.target_metric_id})")
            logger.info(f"System Prompt: {self.config.system_prompt or 'You are a precise data extraction assistant.'}")
            logger.info("-" * 80)
            logger.info("FULL PROMPT:")
            logger.info(prompt)
            logger.info("=" * 80)

            try:
                if self.config.provider == "anthropic":
                    response = await self._call_anthropic(prompt)
                else:
                    response = await self._call_openai(prompt)

                # Log the AI response
                logger.info("=" * 80)
                logger.info(f"AI RESPONSE RECEIVED (Async) - Chunk {chunk_idx + 1}/{len(chunks)}")
                logger.info(f"Response length: {len(response)} characters")
                logger.info("-" * 80)
                logger.info("RAW AI RESPONSE:")
                logger.info(response)
                logger.info("=" * 80)

                parsed_results = self._parse_response(response, chunk, chunk_idx)
                
                # Log parsed results
                if parsed_results:
                    logger.info(f"✅ Successfully parsed {len(parsed_results)} results from AI response")
                    for idx, parsed in enumerate(parsed_results, 1):
                        logger.info(f"   Result {idx}: value={parsed.value}, confidence={parsed.confidence:.2f}")
                        logger.info(f"      Entity: {parsed.entity_type}/{parsed.entity_name}")
                        logger.info(f"      Dimensions: {parsed.dimensions}")
                        logger.info(f"      Geography: {parsed.dimensions.get('geography') if parsed.dimensions else 'N/A'}")
                        logger.info(f"      Location: {parsed.dimensions.get('location') if parsed.dimensions else 'N/A'}")
                else:
                    logger.warning("❌ Failed to parse AI response or no results found")
                
                if parsed_results:
                    results.extend(parsed_results)  # Add all results

            except Exception as e:
                # Log error but continue with other chunks
                print(f"AI extraction error: {e}")
                continue

        return results

    def extract_sync(
        self,
        text: str,
        rule: ExtractionRule,
        chunk_size: int = 8000,
        glossary_metric: Optional[GlossaryMetric] = None
    ) -> list[AIExtractionResult]:
        """Synchronous extraction for simpler use cases."""
        results = []
        variations_text = self._format_variations(rule)
        
        # Get glossary metric if available
        if not glossary_metric and self.glossary_loader:
            glossary_metric = self.glossary_loader.get_metric(rule.target_metric_id)
        
        chunks = self._chunk_text(text, chunk_size)

        for chunk_idx, chunk in enumerate(chunks):
            prompt = self._build_prompt(rule, chunk, variations_text, glossary_metric)

            # Log the full prompt for debugging
            logger.info("=" * 80)
            logger.info(f"AI EXTRACTION PROMPT (Sync) - Chunk {chunk_idx + 1}/{len(chunks)}")
            logger.info(f"Provider: {self.config.provider}, Model: {self.config.model}")
            logger.info(f"Rule ID: {rule.id}, Metric: {rule.target_metric_name} ({rule.target_metric_id})")
            logger.info(f"System Prompt: {self.config.system_prompt or 'You are a precise data extraction assistant.'}")
            logger.info("-" * 80)
            logger.info("FULL PROMPT:")
            logger.info(prompt)
            logger.info("=" * 80)

            try:
                # Force OpenAI for now (ignore Anthropic)
                logger.info(f"🔧 Using OpenAI provider (Anthropic disabled per request)")
                response = self._call_openai_sync(prompt)
                
                # Additional logging after response is received
                logger.info(f"✅ Response received for chunk {chunk_idx + 1}/{len(chunks)}")

                parsed_results = self._parse_response(response, chunk, chunk_idx)
                
                # Log parsed results
                if parsed_results:
                    logger.info(f"✅ Successfully parsed {len(parsed_results)} results from AI response")
                    for idx, parsed in enumerate(parsed_results, 1):
                        logger.info(f"   Result {idx}: value={parsed.value}, confidence={parsed.confidence:.2f}")
                        logger.info(f"      Entity: {parsed.entity_type}/{parsed.entity_name}")
                        logger.info(f"      Dimensions: {parsed.dimensions}")
                        logger.info(f"      Geography: {parsed.dimensions.get('geography') if parsed.dimensions else 'N/A'}")
                        logger.info(f"      Location: {parsed.dimensions.get('location') if parsed.dimensions else 'N/A'}")
                else:
                    logger.warning("❌ Failed to parse AI response or no results found")
                
                if parsed_results:
                    results.extend(parsed_results)  # Add all results

            except Exception as e:
                print(f"AI extraction error: {e}")
                continue

        return results

    def _format_variations(self, rule: ExtractionRule) -> str:
        """Format semantic variations for the prompt."""
        lines = []
        for mapping in rule.semantic_mappings:
            terms = [mapping.canonical_term] + mapping.variations
            lines.append(f"- {', '.join(terms)}")
        return "\n".join(lines) if lines else "No specific variations defined."

    def _build_prompt(
        self, 
        rule: ExtractionRule, 
        text: str, 
        variations: str, 
        glossary_metric: Optional[GlossaryMetric] = None
    ) -> str:
        """Build the extraction prompt with optional glossary enrichment."""
        # Use glossary metric if available, otherwise fall back to rule
        metric_name = glossary_metric.canonical_name if glossary_metric else rule.target_metric_name
        metric_description = glossary_metric.description if glossary_metric else rule.description
        unit = glossary_metric.unit if glossary_metric else rule.unit
        
        # Combine semantic variations from both rule and glossary
        all_variations = variations
        if glossary_metric and glossary_metric.semantic_variations:
            glossary_vars = ", ".join(glossary_metric.semantic_variations)
            if all_variations and all_variations != "No specific variations defined.":
                all_variations = f"{all_variations}\n- Glossary variations: {glossary_vars}"
            else:
                all_variations = f"- Glossary variations: {glossary_vars}"
        
        # Build calculation logic section if available
        calculation_section = ""
        if glossary_metric and glossary_metric.calculation_logic:
            calculation_section = f"\n\nCalculation Logic: {glossary_metric.calculation_logic}"
        
        # Build domain context
        domain_section = ""
        if glossary_metric:
            domain_section = f"\nDomain: {glossary_metric.domain.value.title()}"
        
        # Build validation rules section
        validation_section = ""
        if glossary_metric and glossary_metric.validation_rules:
            validation_section = "\n\nValidation Rules:"
            for vr in glossary_metric.validation_rules:
                validation_section += f"\n- {vr.type}: {vr.error_message}"
        
        # Build dimension constraints section with authorized values
        dimension_constraints_section = ""
        if glossary_metric and glossary_metric.dimensions and self.glossary_loader:
            dimension_constraints_section = "\n\nDIMENSION CONSTRAINTS (CRITICAL - Use ONLY these authorized values):"
            for dim_name in glossary_metric.dimensions:
                # Try to find dimension definition by name or ID
                dim_def = None
                # Try matching by name first
                for dim in self.glossary_loader.get_all_dimensions():
                    if dim.name == dim_name or dim.id == dim_name.lower().replace(" ", "_"):
                        dim_def = dim
                        break
                
                if dim_def and dim_def.values:
                    # Dimension has authorized values - list them
                    values_list = ", ".join(dim_def.values)
                    dimension_constraints_section += f"\n- {dim_name}: MUST be one of [{values_list}]"
                elif dim_def:
                    # Dimension exists but has no authorized values (free text)
                    dimension_constraints_section += f"\n- {dim_name}: Free text (no restrictions)"
                else:
                    # Dimension not found in definitions
                    dimension_constraints_section += f"\n- {dim_name}: Free text (definition not found)"
            
            dimension_constraints_section += "\n\n⚠️ IMPORTANT: If a dimension has authorized values listed above, you MUST use ONLY those values. Do NOT invent or hallucinate new values. If the document contains a value not in the authorized list, use null or the closest matching authorized value."
        
        # Format the prompt with all available information
        prompt_text = self.config.extraction_prompt_template.format(
            metric_name=metric_name,
            metric_description=metric_description,
            unit=unit,
            variations=all_variations,
            text=text[:self.config.max_tokens * 2]  # Rough char limit
        )
        
        # Append glossary-specific sections if available
        if calculation_section or domain_section or validation_section or dimension_constraints_section:
            prompt_text += calculation_section + domain_section + validation_section + dimension_constraints_section
        
        return prompt_text

    def _chunk_text(self, text: str, chunk_size: int) -> list[str]:
        """Split text into chunks for processing."""
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        paragraphs = text.split("\n\n")
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para + "\n\n"

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic API asynchronously."""
        message = self.anthropic_client.messages.create(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            system=self.config.system_prompt or "You are a precise data extraction assistant.",
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    def _call_anthropic_sync(self, prompt: str) -> str:
        """Call Anthropic API synchronously."""
        message = self.anthropic_client.messages.create(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            system=self.config.system_prompt or "You are a precise data extraction assistant.",
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API asynchronously."""
        response = self.openai_client.chat.completions.create(
            model=self.config.model if "gpt" in self.config.model else "gpt-4-turbo-preview",
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            messages=[
                {"role": "system", "content": self.config.system_prompt or "You are a precise data extraction assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content

    def _call_openai_sync(self, prompt: str) -> str:
        """Call OpenAI API synchronously."""
        logger.info("📡 Calling OpenAI API...")
        logger.info(f"   Model: {self.config.model if 'gpt' in self.config.model else 'gpt-4-turbo-preview'}")
        logger.info(f"   Max tokens: {self.config.max_tokens}, Temperature: {self.config.temperature}")
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.config.model if "gpt" in self.config.model else "gpt-4-turbo-preview",
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                messages=[
                    {"role": "system", "content": self.config.system_prompt or "You are a precise data extraction assistant."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract response content
            response_text = response.choices[0].message.content
            
            # Log the raw response immediately
            logger.info("=" * 80)
            logger.info("📥 OPENAI API RESPONSE RECEIVED")
            logger.info(f"Response length: {len(response_text)} characters")
            logger.info(f"Finish reason: {response.choices[0].finish_reason}")
            logger.info(f"Tokens used: {response.usage.total_tokens if hasattr(response, 'usage') else 'N/A'}")
            logger.info("-" * 80)
            logger.info("RAW RESPONSE FROM OPENAI:")
            logger.info(response_text)
            logger.info("=" * 80)
            
            return response_text
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error(f"❌ OPENAI API CALL FAILED")
            logger.error(f"Error: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error("=" * 80)
            raise

    def _parse_response(self, response: str, chunk: str, chunk_idx: int) -> List[AIExtractionResult]:
        """Parse the AI response into structured data with entities, dimensions, and metrics.
        Returns a LIST of all extracted results."""
        results = []
        try:
            # Find JSON in response
            json_match = response
            if "```json" in response:
                json_match = response.split("```json")[1].split("```")[0]
                logger.debug("Found JSON in ```json code block")
            elif "```" in response:
                json_match = response.split("```")[1].split("```")[0]
                logger.debug("Found JSON in ``` code block")
            else:
                logger.debug("Parsing JSON directly from response")

            logger.debug(f"Extracted JSON string length: {len(json_match.strip())} characters")
            data = json.loads(json_match.strip())
            logger.debug(f"✅ Successfully parsed JSON: {list(data.keys())}")
            
            # Check if response has "results" array (new format) or single result (old format)
            if "results" in data:
                results_list = data["results"]
                logger.info(f"📊 Found {len(results_list)} results in response")
            else:
                # Legacy format: single result, wrap in array
                logger.info("📊 Found single result (legacy format), converting to array")
                results_list = [data]

            # Process each result in the array
            for result_idx, result_data in enumerate(results_list):
                try:
                    # Extract structured data following the schema
                    entity_data = result_data.get("entity", {})
                    dimensions_data = result_data.get("dimensions", {})
                    metric_data = result_data.get("metric", {})
                    source_data = result_data.get("source", {})

                    # Get value from metric object or fallback to top-level
                    value = metric_data.get("value") if metric_data else result_data.get("value")
                    
                    # Skip if value is null/None
                    if value is None:
                        logger.debug(f"Skipping result {result_idx + 1}: value is null")
                        continue
                    
                    # Get confidence from metric object or fallback (must be present)
                    confidence = metric_data.get("confidence") if metric_data else result_data.get("confidence", 0.5)
                    if confidence is None:
                        confidence = 0.5  # Default if missing
                    
                    # Ensure confidence is between 0.0 and 1.0
                    confidence = max(0.0, min(1.0, float(confidence)))

                    # Extract fiscal year from dimensions or top-level
                    fiscal_year = dimensions_data.get("fiscal_year") if dimensions_data else result_data.get("fiscal_year")
                    if fiscal_year:
                        try:
                            fiscal_year = int(fiscal_year)
                        except (ValueError, TypeError):
                            fiscal_year = None

                    # Extract geography/location from dimensions
                    geography = dimensions_data.get("geography") if dimensions_data else None
                    location = dimensions_data.get("location") if dimensions_data else None
                    
                    # Extract raw text from source or top-level
                    raw_text = source_data.get("raw_text") if source_data else result_data.get("raw_text", "")
                    if not raw_text:
                        raw_text = result_data.get("raw_text", "")

                    # Extract context from source
                    context = source_data.get("context") if source_data else chunk[:500]
                    
                    # Extract page number
                    page_num = source_data.get("page_number") if source_data else (chunk_idx + 1)

                    # Build dimensions dict including geography
                    all_dimensions = dimensions_data.copy() if dimensions_data else {}
                    if geography:
                        all_dimensions["geography"] = geography
                    if location:
                        all_dimensions["location"] = location

                    result = AIExtractionResult(
                        value=float(value),
                        raw_text=raw_text,
                        confidence=confidence,
                        fiscal_year=fiscal_year,
                        notes=result_data.get("notes"),
                        source=ExtractionSource(
                            context=context,
                            matched_pattern="AI extraction",
                            raw_text=raw_text,
                            page=page_num
                        ),
                        # Structured data fields
                        entity_type=entity_data.get("type") if entity_data else None,
                        entity_name=entity_data.get("name") if entity_data else None,
                        entity_id=entity_data.get("id") if entity_data else None,
                        dimensions=all_dimensions,
                        metric_name=metric_data.get("metric_name") if metric_data else None,
                        unit=metric_data.get("unit") if metric_data else result_data.get("unit")
                    )
                    
                    results.append(result)
                    logger.info(f"  ✅ Result {result_idx + 1}: value={result.value}, confidence={result.confidence:.2f}, geography={geography}, location={location}")
                    
                except Exception as e:
                    logger.warning(f"Failed to parse result {result_idx + 1}: {e}")
                    continue
            
            logger.info(f"📊 Successfully parsed {len(results)} results from {len(results_list)} found")
            return results

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error("=" * 80)
            logger.error(f"❌ FAILED TO PARSE AI RESPONSE")
            logger.error(f"Error: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error("-" * 80)
            logger.error(f"Full response (first 1000 chars):")
            logger.error(response[:1000])
            if len(response) > 1000:
                logger.error(f"... (truncated, total length: {len(response)} chars)")
            logger.error("=" * 80)
            return []  # Return empty list instead of None


class MockAIExtractor(AIExtractor):
    """Mock AI extractor for testing without API calls."""

    def extract_sync(
        self,
        text: str,
        rule: ExtractionRule,
        chunk_size: int = 8000,
        glossary_metric: Optional[GlossaryMetric] = None
    ) -> list[AIExtractionResult]:
        """Return mock extraction results."""
        import re
        import random

        results = []

        # Find any numeric values in the text
        matches = re.findall(r'\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million)?', text)

        if matches:
            value, mult = matches[0]
            clean_value = float(value.replace(",", ""))

            multipliers = {"b": 1e9, "B": 1e9, "m": 1e6, "M": 1e6, "k": 1e3, "K": 1e3,
                         "billion": 1e9, "million": 1e6}
            if mult:
                clean_value *= multipliers.get(mult, 1)

            results.append(AIExtractionResult(
                value=clean_value,
                raw_text=f"${value}{mult or ''}",
                confidence=random.uniform(0.75, 0.95),
                fiscal_year=2024,
                notes="Mock AI extraction result",
                source=ExtractionSource(
                    context=text[:300],
                    matched_pattern="AI extraction (mock)",
                    raw_text=f"${value}{mult or ''}"
                )
            ))

        return results
