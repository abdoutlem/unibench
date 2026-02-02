# Real AI Extraction with Structured Output

## Changes Made

### 1. ✅ Enabled Real AI Extraction (No More Mock Data)

**Problem**: System was using `MockAIExtractor` by default, returning fake data.

**Fix**:
- Changed `extraction_service = ExtractionService(use_mock_ai=True)` → `use_mock_ai=False`
- System now uses real AI if API keys are configured
- Falls back to mock only if no API keys are available (with warning)

**Location**: `backend/app/api/routes.py` (line 36)

### 2. ✅ Structured AI Response Schema (Entities, Dimensions, Metrics)

**Problem**: AI responses were unstructured, missing entities and dimensions.

**Fix**: Updated prompt template to require structured output:

```json
{
    "entity": {
        "type": "Institution",
        "name": "University Name",
        "id": "inst-001"
    },
    "dimensions": {
        "fiscal_year": 2024,
        "document_type": "financial_statement",
        "period": "FY2024"
    },
    "metric": {
        "value": 125000000,
        "unit": "currency",
        "confidence": 0.95,
        "metric_name": "Total Revenue"
    },
    "source": {
        "raw_text": "Total Revenue: $125 million",
        "page_number": 1,
        "context": "Financial statement for fiscal year 2024..."
    },
    "fiscal_year": 2024,
    "notes": "Found in income statement"
}
```

**Location**: `backend/app/models/extraction.py` (extraction_prompt_template)

### 3. ✅ Enhanced AIExtractionResult Model

**Added fields**:
- `entity_type`: Type of entity (e.g., "Institution", "Document")
- `entity_name`: Name of the entity
- `entity_id`: Unique identifier
- `dimensions`: Dictionary of dimension values
- `metric_name`: Name of the metric
- `unit`: Unit of measurement

**Location**: `backend/app/services/ai_extractor.py` (AIExtractionResult dataclass)

### 4. ✅ Improved Response Parsing

**Enhanced `_parse_response()`** to:
- Extract structured entity, dimensions, and metric data
- Always require confidence score (0.0-1.0)
- Handle missing values gracefully
- Extract fiscal_year from dimensions or top-level
- Extract context and page numbers from source object

**Location**: `backend/app/services/ai_extractor.py` (_parse_response method)

### 5. ✅ Better Logging

**Added logging** to show:
- Entity type and name
- Dimension values
- Confidence scores
- When real AI vs mock AI is used

**Location**: `backend/app/services/extraction_service.py`

## How It Works Now

### Extraction Flow

1. **User uploads document** → PDF/Excel/etc.

2. **System checks for API keys**:
   - ✅ Has API keys → Uses **real AI** (Claude Sonnet 4 or GPT-4)
   - ❌ No API keys → Uses **mock AI** (with warning)

3. **AI receives structured prompt**:
   - Metric definition from glossary
   - Calculation logic
   - Semantic variations
   - Instructions to return entities, dimensions, metrics

4. **AI responds with structured JSON**:
   - Entity information
   - Dimension values (fiscal_year, document_type, etc.)
   - Metric value with confidence score
   - Source context

5. **System parses and stores**:
   - Extracts all structured fields
   - Validates confidence score (0.0-1.0)
   - Stores as FactMetric with domain classification

### Confidence Score Requirements

**The AI MUST always provide a confidence score** based on:
- How clearly the value is stated
- Whether it matches the metric description
- Whether units match expected unit
- Context clarity

**Confidence ranges**:
- `0.9-1.0`: Very high confidence (exact match, clear context)
- `0.7-0.9`: High confidence (good match, some ambiguity)
- `0.5-0.7`: Medium confidence (possible match, needs review)
- `0.0-0.5`: Low confidence (uncertain, likely incorrect)

## Configuration

### To Use Real AI

1. **Set API keys in `.env` file**:
   ```bash
   ANTHROPIC_API_KEY=your_key_here
   # OR
   OPENAI_API_KEY=your_key_here
   ```

2. **Restart backend server**

3. **Check logs** - Should see:
   ```
   Using real AI extraction with provider: anthropic, model: claude-sonnet-4-20250514
   ```

### If No API Keys

System will:
- Use MockAIExtractor
- Log warning: "Using MockAIExtractor - configure API keys in .env to use real AI"
- Still return structured data (but fake values)

## Example AI Response

```json
{
    "entity": {
        "type": "Institution",
        "name": "State University",
        "id": "inst-state-univ-001"
    },
    "dimensions": {
        "fiscal_year": 2024,
        "document_type": "financial_statement",
        "period": "FY2024",
        "report_type": "annual"
    },
    "metric": {
        "value": 125000000,
        "unit": "currency",
        "confidence": 0.92,
        "metric_name": "Total Operating Revenue"
    },
    "source": {
        "raw_text": "Total Operating Revenue: $125,000,000",
        "page_number": 3,
        "context": "Statement of Revenues and Expenses for the fiscal year ended June 30, 2024..."
    },
    "fiscal_year": 2024,
    "notes": "Found in consolidated financial statements, includes all operating revenue sources"
}
```

## Benefits

✅ **Real data extraction** - No more mock data  
✅ **Structured output** - Entities, dimensions, metrics clearly separated  
✅ **Confidence scores** - Always provided (0.0-1.0)  
✅ **Better categorization** - Domain classification from glossary  
✅ **Rich context** - Source text, page numbers, surrounding context  
✅ **Validation ready** - Structured data ready for fact table storage  

## Next Steps

1. **Configure API keys** in `.env` file
2. **Test extraction** with a real document
3. **Verify structured output** in extraction results
4. **Check confidence scores** are reasonable
5. **Review entity/dimension extraction** accuracy
