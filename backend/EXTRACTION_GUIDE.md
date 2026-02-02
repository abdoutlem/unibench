# Data Extraction Guide

This guide explains how to extract data from files using the UniBench extraction API.

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys if you want to use real AI extraction
   # For testing, you can leave them empty - the system will use mock AI
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
   
   Or using Python directly:
   ```bash
   cd backend
   python -m app.main
   ```

   The API will be available at: `http://localhost:8000`
   API docs (Swagger): `http://localhost:8000/docs`
   ReDoc: `http://localhost:8000/redoc`

## Available Extraction Rules

The system comes with pre-configured extraction rules. You can list them:

```bash
curl http://localhost:8000/api/v1/rules
```

Available mock rules include:
- `rule-total-revenue` - Total Operating Revenue
- `rule-net-income` - Net Income
- `rule-total-assets` - Total Assets
- `rule-employee-count` - Employee Count

## Method 1: Quick Extraction (Recommended)

The `/extract` endpoint allows you to upload a file and extract data immediately.

### Using cURL

```bash
curl -X POST "http://localhost:8000/api/v1/extract" \
  -F "file=@/path/to/your/document.pdf" \
  -F "rule_ids=rule-total-revenue,rule-net-income" \
  -F "method=HYBRID"
```

### Using Python

```python
import requests

url = "http://localhost:8000/api/v1/extract"

# Prepare the file and parameters
files = {
    'file': ('document.pdf', open('/path/to/your/document.pdf', 'rb'), 'application/pdf')
}
data = {
    'rule_ids': 'rule-total-revenue,rule-net-income',  # Comma-separated rule IDs
    'method': 'HYBRID'  # Options: HYBRID, RULE_BASED, AI
}

response = requests.post(url, files=files, data=data)
result = response.json()

print("Extraction Results:")
for result_item in result.get('results', []):
    print(f"  - {result_item['metric_name']}: {result_item['extracted_value']}")
    print(f"    Confidence: {result_item['confidence']}")
    print(f"    Status: {result_item['status']}")
```

### Using JavaScript/TypeScript (Frontend)

```typescript
const formData = new FormData();
formData.append('file', file); // File object from input
formData.append('rule_ids', 'rule-total-revenue,rule-net-income');
formData.append('method', 'HYBRID');

const response = await fetch('http://localhost:8000/api/v1/extract', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('Extraction results:', result.results);
```

## Method 2: Job-Based Extraction

For processing multiple files or more complex workflows:

### Step 1: Create a Job

```bash
curl -X POST "http://localhost:8000/api/v1/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "document_ids": ["doc1", "doc2"],
    "rule_ids": ["rule-total-revenue", "rule-net-income"],
    "method": "HYBRID"
  }'
```

### Step 2: Run the Job

```bash
curl -X POST "http://localhost:8000/api/v1/jobs/{job_id}/run"
```

### Step 3: Get Results

```bash
curl "http://localhost:8000/api/v1/jobs/{job_id}"
```

## Extraction Methods

- **HYBRID** (default): Uses both rule-based and AI extraction, returns the best result
- **RULE_BASED**: Uses only pattern matching and regex rules
- **AI**: Uses only AI extraction (requires API keys configured)

## Supported File Types

- PDF (`.pdf`)
- Excel (`.xlsx`, `.xls`)
- Word (`.docx`, `.doc`)
- PowerPoint (`.pptx`, `.ppt`)
- CSV (`.csv`)
- Plain Text (`.txt`)

## Response Format

The extraction endpoint returns a job object with results:

```json
{
  "id": "job-abc123",
  "status": "completed",
  "progress": 100.0,
  "results": [
    {
      "id": "res-xyz789",
      "metric_name": "Total Operating Revenue",
      "extracted_value": "1234567890",
      "normalized_value": 1234567890.0,
      "unit": "currency",
      "confidence": 0.95,
      "status": "pending_review",
      "source": {
        "context": "...",
        "matched_pattern": "Total Operating Revenue",
        "raw_text": "$1,234,567,890"
      }
    }
  ]
}
```

## Creating Custom Extraction Rules

You can create custom rules via the API:

```bash
curl -X POST "http://localhost:8000/api/v1/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Metric",
    "description": "Extract custom metric from documents",
    "target_metric_id": "metric-custom",
    "target_metric_name": "Custom Metric",
    "unit": "currency",
    "patterns": [
      {
        "type": "label_value",
        "pattern": "Custom Metric",
        "priority": 1,
        "confidence": 0.9
      }
    ],
    "extraction_method": "HYBRID"
  }'
```

## Testing with Sample Files

1. Create a simple text file (`test.txt`):
   ```
   Financial Report 2024
   Total Operating Revenue: $1,234,567,890
   Net Income: $500,000,000
   ```

2. Extract data:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/extract" \
     -F "file=@test.txt" \
     -F "rule_ids=rule-total-revenue,rule-net-income" \
     -F "method=HYBRID"
   ```

## Troubleshooting

1. **File size too large**: Maximum file size is 50MB (configurable in `.env`)

2. **Unsupported file type**: Check that your file extension is in the supported list

3. **No rules found**: Make sure rule IDs exist. List available rules first:
   ```bash
   curl http://localhost:8000/api/v1/rules
   ```

4. **AI extraction not working**: 
   - Check that API keys are set in `.env`
   - Or use `method=RULE_BASED` to skip AI extraction
   - Mock AI will be used if keys are not configured

5. **Server not starting**: 
   - Check that all dependencies are installed
   - Verify Python version (3.8+)
   - Check port 8000 is not in use

## API Documentation

Full interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
