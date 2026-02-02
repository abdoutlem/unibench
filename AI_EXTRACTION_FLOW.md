# AI Extraction Flow: How Glossary Metrics Guide Extraction

This document explains how the AI extraction system works and how glossary metrics influence the extraction process.

## Overview

The AI extraction system uses a **two-stage process**:
1. **Extraction**: AI extracts values from documents using prompts enriched with glossary definitions
2. **Categorization**: Extracted values are matched to glossary metrics and categorized by domain

## System Prompt Location

### 1. System Prompt (Base Instructions)

**Location**: `backend/app/services/ai_extractor.py` (lines 193, 204, 216, 229)

```python
system=self.config.system_prompt or "You are a precise data extraction assistant."
```

**Default**: `"You are a precise data extraction assistant."`

**Customization**: Set `system_prompt` in `AIConfig` (see `backend/app/models/extraction.py`)

**Purpose**: Provides base instructions to the AI model about its role and behavior.

### 2. Extraction Prompt Template (Task-Specific Instructions)

**Location**: `backend/app/models/extraction.py` (lines 176-203)

**Default Template**:
```
Extract the following metric from the document text.

Metric to extract: {metric_name}
Description: {metric_description}
Expected unit: {unit}

Known variations of this metric:
{variations}

Document text:
{text}

Instructions:
1. Find the value for this metric in the text
2. Return the numeric value only
3. If the value is in millions/billions, convert to full number
4. If not found, return null
5. Include the exact text where you found this value

Respond in JSON format:
{
    "value": <number or null>,
    "raw_text": "<exact text matched>",
    "confidence": <0.0-1.0>,
    "fiscal_year": <year if found, else null>,
    "notes": "<any relevant notes>"
}
```

**Customization**: Override `extraction_prompt_template` in `AIConfig`.

## How Glossary Metrics Influence Extraction

### Current Flow (Step-by-Step)

1. **User selects extraction rule** → Frontend calls `/api/v1/extract` with `rule_ids`

2. **Backend resolves rules** → `backend/app/api/routes.py`:
   - Loads `ExtractionRule` objects from `rules_db`
   - Each rule has a `target_metric_id` pointing to a glossary metric

3. **Extraction service processes document** → `backend/app/services/extraction_service.py`:
   ```python
   # Line 180: Get glossary metric for enhanced extraction
   glossary_metric = self.glossary_loader.get_metric(rule.target_metric_id)
   
   # Line 181: Pass glossary metric to AI extractor
   ai_results = self.ai_extractor.extract_sync(doc.text, rule, glossary_metric=glossary_metric)
   ```

4. **AI extractor builds prompt** → `backend/app/services/ai_extractor.py`:
   ```python
   # Line 129: Build prompt with glossary context
   prompt = self._build_prompt(rule, chunk, variations_text, glossary_metric)
   ```

5. **Prompt enrichment** (currently **partially implemented**):
   - ✅ Uses `rule.target_metric_name` → becomes `{metric_name}` in prompt
   - ✅ Uses `rule.description` → becomes `{metric_description}` in prompt
   - ✅ Uses `rule.unit` → becomes `{unit}` in prompt
   - ✅ Uses `rule.semantic_mappings` → becomes `{variations}` in prompt
   - ⚠️ **BUG**: `glossary_metric` parameter is passed but **not used** in `_build_prompt()`!

### What Glossary Metrics Should Add (Currently Missing)

The glossary metric contains rich information that should enhance the prompt:

- **`glossary_metric.description`**: More detailed description than rule description
- **`glossary_metric.calculation_logic`**: How the metric is calculated (critical for accurate extraction)
- **`glossary_metric.semantic_variations`**: Additional alternative names/phrasings
- **`glossary_metric.domain`**: Domain context (Students, Faculty, Research, etc.)
- **`glossary_metric.validation_rules`**: Constraints (e.g., "must be positive", "range: 0-100")

### Example: Enhanced Prompt with Glossary

**Current prompt** (without glossary):
```
Extract the following metric from the document text.

Metric to extract: Total Revenue
Description: Revenue from operations
Expected unit: currency

Known variations of this metric:
- Total Revenue, Gross Revenue
```

**Enhanced prompt** (with glossary):
```
Extract the following metric from the document text.

Metric to extract: Total Operating Revenue
Description: Total revenue from all operating sources including tuition, fees, grants, and auxiliary services
Expected unit: currency

Domain: Finance

Calculation Logic: Sum of all operating revenue line items from the financial statement. Excludes non-operating revenue such as investment income.

Known variations of this metric:
- Total Revenue, Gross Revenue, Operating Revenue, Total Income, Revenue Total

Validation Rules:
- Value must be positive (min: 0)
- Typical range for universities: $10M - $5B

Document text:
{text}
```

## How Categorization Works

### Step 1: Extraction (AI or Rule-Based)

The AI extracts a value and returns:
```json
{
    "value": 125000000,
    "raw_text": "Total Operating Revenue: $125 million",
    "confidence": 0.92,
    "fiscal_year": 2024
}
```

### Step 2: Matching to Glossary

**Location**: `backend/app/services/extraction_service.py` (lines 213-214)

```python
# Get glossary metric for domain classification
glossary_metric = self.glossary_loader.get_metric(rule.target_metric_id)
```

The `rule.target_metric_id` directly maps to a glossary metric, so categorization is **automatic**:
- If `rule.target_metric_id = "metric-total-revenue"` → loads glossary metric with `domain = "finance"`

### Step 3: Domain Classification

**Location**: `backend/app/services/extraction_service.py` (lines 226-246)

When saving extracted facts:
```python
fact = FactMetric(
    metric_id=rule.target_metric_id,
    domain=glossary_metric.domain,  # ← Domain comes from glossary!
    value=float(best_result.normalized_value),
    unit=glossary_metric.unit,
    ...
)
```

**Result**: Every extracted value is automatically categorized by domain:
- `domain = "students"` → Student metrics
- `domain = "finance"` → Financial metrics
- `domain = "faculty"` → Faculty metrics
- etc.

### Step 4: Fuzzy Matching (Alternative Path)

**Location**: `backend/app/services/glossary_matcher.py`

If text doesn't match a specific rule, `GlossaryMatcher` can match free-form text to glossary metrics:

```python
matches = glossary_matcher.match_text("Total Revenue", domain="finance")
# Returns: [GlossaryMatch(metric_id="metric-total-revenue", confidence=0.95, ...)]
```

This uses:
- **Semantic variations** from glossary (`glossary_metric.semantic_variations`)
- **Fuzzy string matching** (rapidfuzz library)
- **Domain filtering** (only matches within specified domain)

## Current Limitations & Improvements Needed

### 1. Glossary Metrics Not Fully Used in Prompts

**Problem**: `glossary_metric` is passed to `_build_prompt()` but the method signature doesn't accept it.

**Fix Needed**: Update `_build_prompt()` to accept and use `glossary_metric`:
- Include `calculation_logic` in prompt
- Add `semantic_variations` from glossary (not just rule mappings)
- Include `validation_rules` as constraints
- Add `domain` context

### 2. Prompt Template Doesn't Support Glossary Fields

**Problem**: Current template only has placeholders for:
- `{metric_name}`
- `{metric_description}`
- `{unit}`
- `{variations}`
- `{text}`

**Fix Needed**: Extend template to include:
- `{calculation_logic}`
- `{domain}`
- `{validation_rules}`

### 3. System Prompt is Generic

**Problem**: Default system prompt is very basic: `"You are a precise data extraction assistant."`

**Improvement**: Add domain-specific context:
```
You are a precise data extraction assistant specializing in higher education metrics. 
You understand financial statements, enrollment reports, and institutional data.
You extract values according to strict definitions and calculation logic.
```

## Code Locations Summary

| Component | File | Key Methods |
|-----------|------|-------------|
| **System Prompt** | `backend/app/services/ai_extractor.py` | `_call_anthropic()`, `_call_openai()` |
| **Extraction Prompt Template** | `backend/app/models/extraction.py` | `AIConfig.extraction_prompt_template` |
| **Prompt Building** | `backend/app/services/ai_extractor.py` | `_build_prompt()` |
| **Glossary Loading** | `backend/app/services/glossary_loader.py` | `get_metric()` |
| **Extraction Orchestration** | `backend/app/services/extraction_service.py` | `_extract_with_rule()` |
| **Domain Categorization** | `backend/app/services/extraction_service.py` | `_extract_with_rule()` (line 230) |
| **Fuzzy Matching** | `backend/app/services/glossary_matcher.py` | `match_text()` |

## Example: Full Extraction Flow

1. **User uploads PDF** → "Financial Statement 2024.pdf"

2. **User selects rule** → `rule-total-revenue` (which maps to `metric-total-revenue`)

3. **Backend loads glossary**:
   ```python
   glossary_metric = glossary_loader.get_metric("metric-total-revenue")
   # Returns: GlossaryMetric(
   #   id="metric-total-revenue",
   #   domain="finance",
   #   name="Total Operating Revenue",
   #   calculation_logic="Sum of all operating revenue line items",
   #   semantic_variations=["Total Revenue", "Gross Revenue", "Operating Revenue"],
   #   ...
   # )
   ```

4. **AI prompt is built** (currently uses rule, should use glossary):
   ```
   Extract: Total Operating Revenue
   Description: Total revenue from all operating sources
   Unit: currency
   Variations: Total Revenue, Gross Revenue
   ```

5. **AI extracts value**:
   ```json
   {"value": 125000000, "raw_text": "Total Operating Revenue: $125 million", "confidence": 0.92}
   ```

6. **Value is categorized**:
   ```python
   fact = FactMetric(
       domain=glossary_metric.domain,  # "finance"
       metric_id="metric-total-revenue",
       value=125000000,
       ...
   )
   ```

7. **Fact is saved** → Available for queries by domain, metric, fiscal year, etc.

## Next Steps

1. **Fix `_build_prompt()`** to accept and use `glossary_metric` parameter
2. **Enhance prompt template** to include glossary fields
3. **Add domain context** to system prompt
4. **Test extraction quality** with enhanced prompts
