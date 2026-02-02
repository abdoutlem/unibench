# AI Configuration Guide

This guide explains how to configure AI providers (Anthropic Claude or OpenAI GPT) for the UniBench extraction system.

## Overview

The system supports two AI providers:
- **Anthropic Claude** (Recommended) - More cost-effective and better at structured extraction
- **OpenAI GPT** - Alternative option

You can configure one or both providers. The system will use the default provider specified in your configuration.

## Quick Setup

### Step 1: Get API Keys

#### For Anthropic (Claude):
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

#### For OpenAI (GPT):
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Navigate to "API Keys"
4. Create a new secret key
5. Copy the key (starts with `sk-...`)

### Step 2: Create `.env` File

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your API keys:
   ```bash
   # For Anthropic (recommended)
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   
   # OR for OpenAI
   OPENAI_API_KEY=sk-your-actual-key-here
   
   # Set default provider
   DEFAULT_AI_PROVIDER=anthropic
   DEFAULT_AI_MODEL=claude-sonnet-4-20250514
   ```

### Step 3: Install Dependencies

Make sure you have the required packages installed:

```bash
cd backend
pip install -r requirements.txt
```

The required packages are already in `requirements.txt`:
- `anthropic>=0.18.0` - For Claude API
- `openai>=1.10.0` - For OpenAI API

### Step 4: Verify Configuration

Start the backend server:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Check the startup logs. You should see:
```
Extraction methods available:
  - RULE_BASED: Always available
  - AI: Available
  - HYBRID: Available
```

If you see "Not configured (using mock)" instead of "Available", check that:
1. Your `.env` file exists in the `backend` directory
2. The API key is correctly set (no extra spaces or quotes)
3. The environment variable name matches exactly (case-sensitive)

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `None` | No* |
| `OPENAI_API_KEY` | OpenAI API key | `None` | No* |
| `DEFAULT_AI_PROVIDER` | Default provider (`anthropic` or `openai`) | `anthropic` | No |
| `DEFAULT_AI_MODEL` | Default model to use | `claude-sonnet-4-20250514` | No |

*At least one AI provider must be configured for AI extraction to work.

### Supported Models

#### Anthropic Models:
- `claude-sonnet-4-20250514` (Recommended) - Latest and most capable
- `claude-3-5-sonnet-20241022` - Previous generation
- `claude-3-opus-20240229` - Most capable of Claude 3 series
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-haiku-20240307` - Fastest and cheapest

#### OpenAI Models:
- `gpt-4-turbo-preview` (Recommended) - Latest GPT-4
- `gpt-4` - Standard GPT-4
- `gpt-3.5-turbo` - Faster and cheaper option

## How It Works

### Extraction Methods

The system supports three extraction methods:

1. **RULE_BASED**: Uses pattern matching and regex rules only (no AI)
2. **AI**: Uses AI extraction exclusively
3. **HYBRID** (Default): Combines both methods
   - First tries rule-based extraction
   - Falls back to AI if no results or low confidence (< 0.8)
   - Uses the best result

### AI Extraction Flow

When AI extraction is used:

1. **Document Parsing**: Extracts text from PDF/Excel/PPT files
2. **Glossary Loading**: Loads metric definitions from glossary
3. **AI Prompt Building**: Creates enhanced prompts with:
   - Glossary metric definitions
   - Calculation logic
   - Semantic variations
   - Domain context
4. **AI Extraction**: Sends prompt to AI provider
5. **Result Parsing**: Extracts structured JSON response
6. **Glossary Matching**: Matches extracted values to glossary metrics
7. **Fact Storage**: Saves to unified data model with domain classification

### Mock AI Mode

If no API keys are configured, the system uses `MockAIExtractor` which:
- Returns simulated extraction results
- Useful for testing and development
- Does not make actual API calls

To disable mock mode, set `use_mock_ai=False` when initializing `ExtractionService`:

```python
from app.services import ExtractionService
service = ExtractionService(use_mock_ai=False)
```

## Testing AI Configuration

### Test with cURL

```bash
# Test extraction endpoint
curl -X POST "http://localhost:8000/api/v1/extract" \
  -F "file=@test.pdf" \
  -F "rule_ids=rule-total-revenue" \
  -F "method=AI"
```

### Test with Python

```python
from app.services import ExtractionService
from app.models import ExtractionMethod, ExtractionRule

# Create service (will use real AI if keys are configured)
service = ExtractionService(use_mock_ai=False)

# Create a test rule
rule = ExtractionRule(
    id="test-rule",
    name="Test Rule",
    description="Test extraction",
    target_metric_id="metric-total-revenue",
    target_metric_name="Total Revenue",
    unit="currency"
)

# Extract from text
results = service.process_document(
    file_path="test.pdf",
    file_content=None,  # Will read from file_path
    rules=[rule],
    method=ExtractionMethod.AI,
    document_id="test-doc",
    job_id="test-job"
)

print(f"Found {len(results)} results")
```

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not configured"

**Solution**: 
1. Check that `.env` file exists in `backend` directory
2. Verify the key is set: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the server after changing `.env`

### Issue: "anthropic package not installed"

**Solution**:
```bash
pip install anthropic>=0.18.0
```

### Issue: AI extraction returns errors

**Possible causes**:
1. Invalid API key - Check key is correct and active
2. Insufficient credits - Check your API account balance
3. Rate limits - Wait and retry
4. Model not available - Check model name is correct

### Issue: Mock AI is being used instead of real AI

**Check**:
1. API keys are set in `.env`
2. Server was restarted after setting keys
3. `use_mock_ai=False` is set (if using programmatically)

Check logs for:
```
Using AIExtractor with provider: anthropic, model: claude-sonnet-4-20250514
```

Instead of:
```
Using MockAIExtractor (mock_ai=True or API keys not configured)
```

## Cost Considerations

### Anthropic Pricing (as of 2024):
- Claude Sonnet 4: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Claude 3.5 Sonnet: ~$3/$15 per 1M tokens
- Claude 3 Haiku: ~$0.25/$1.25 per 1M tokens (cheapest)

### OpenAI Pricing (as of 2024):
- GPT-4 Turbo: ~$10/$30 per 1M tokens
- GPT-3.5 Turbo: ~$0.50/$1.50 per 1M tokens (cheaper)

**Recommendation**: Start with Claude 3 Haiku for cost-effective testing, then upgrade to Sonnet 4 for production.

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment-specific keys** - Different keys for dev/staging/prod
3. **Rotate keys regularly** - Update keys periodically
4. **Monitor usage** - Set up billing alerts
5. **Use least privilege** - Only grant necessary API permissions

## Next Steps

Once AI is configured:

1. Test extraction with sample documents
2. Review extracted results in the fact table
3. Adjust glossary definitions as needed
4. Fine-tune extraction rules for better accuracy
5. Monitor AI costs and usage

For more information, see:
- [Extraction Guide](backend/EXTRACTION_GUIDE.md)
- [Glossary Documentation](backend/app/data/glossary/README.md)
