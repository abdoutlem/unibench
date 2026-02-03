# Metric Request Format

This document describes the exact format for creating and updating metrics via the API.

## Endpoints

- **Create/Update**: `POST /api/v1/glossary/metrics`
- **Update**: `PUT /api/v1/glossary/metrics/{metric_id}`
- **Get**: `GET /api/v1/glossary/metrics/{metric_id}`
- **List**: `GET /api/v1/glossary/metrics`

## Request Format

### Content-Type
```
Content-Type: application/json
```

### Complete Example

```json
{
  "id": "metric-total-revenue",
  "domain": "finance",
  "name": "Total Operating Revenue",
  "canonical_name": "Total Operating Revenue",
  "description": "Total revenue from all operating sources including tuition, grants, and auxiliary services",
  "calculation_logic": "Sum of all operating revenue line items from audited financial statements",
  "data_owner": "Finance Department",
  "source": "internal-document",
  "update_frequency": "annual",
  "unit": "currency",
  "semantic_variations": [
    "Total Revenue",
    "Gross Revenue",
    "Operating Revenue",
    "Total Income",
    "Operating Income"
  ],
  "validation_rules": [
    {
      "type": "range",
      "params": {
        "min": 0,
        "max": 100000000000
      },
      "error_message": "Revenue must be positive and reasonable"
    }
  ],
  "entities": [
    "Institution"
  ],
  "dimensions": [
    "FiscalYear",
    "DocumentType"
  ],
  "version": "1.0",
  "effective_date": "2024-01-01",
  "is_active": true
}
```

## Field Descriptions

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier for the metric (kebab-case recommended) | `"metric-total-revenue"` |
| `domain` | string | One of: `students`, `faculty`, `research`, `administrative_staff`, `operations`, `finance` | `"finance"` |
| `name` | string | Display name for the metric | `"Total Operating Revenue"` |
| `canonical_name` | string | Standard name used for matching (usually same as `name`) | `"Total Operating Revenue"` |
| `description` | string | Detailed description of what this metric represents | `"Total revenue from all operating sources..."` |
| `calculation_logic` | string | How this metric is calculated or derived | `"Sum of all operating revenue line items"` |
| `data_owner` | string | Department or person responsible for this metric | `"Finance Department"` |
| `source` | string | Primary data source | `"internal-document"`, `"ipeds"`, `"common-data-set"` |
| `update_frequency` | string | How often this metric is updated | `"annual"`, `"quarterly"`, `"monthly"`, `"as-needed"` |
| `unit` | string | Unit of measurement | `"currency"`, `"percentage"`, `"count"`, `"ratio"` |
| `effective_date` | string | Date when this definition became effective (YYYY-MM-DD format) | `"2024-01-01"` |

### Optional Fields

| Field | Type | Default | Description | Example |
|-------|------|---------|-------------|---------|
| `semantic_variations` | array of strings | `[]` | Alternative names/phrasings for matching | `["Total Revenue", "Gross Revenue"]` |
| `validation_rules` | array of objects | `[]` | Rules for validating extracted values | See Validation Rules below |
| `entities` | array of strings | `[]` | Entity types this metric applies to | `["Institution"]` |
| `dimensions` | array of strings | `[]` | Dimension types (FiscalYear, DocumentType, etc.) | `["FiscalYear", "DocumentType"]` |
| `version` | string | `"1.0"` | Version string | `"1.0"`, `"2.0"` |
| `is_active` | boolean | `true` | Whether metric is active | `true`, `false` |
| `created_at` | string (ISO 8601) | auto-generated | Creation timestamp (only for updates) | `"2024-01-01T12:00:00Z"` |
| `updated_at` | string (ISO 8601) | auto-generated | Last update timestamp | `"2024-01-01T12:00:00Z"` |

## Validation Rules

Validation rules are objects with the following structure:

```json
{
  "type": "range",
  "params": {
    "min": 0,
    "max": 100
  },
  "error_message": "Value must be between 0 and 100"
}
```

### Validation Rule Types

1. **range**: Validates numeric range
   ```json
   {
     "type": "range",
     "params": {
       "min": 0,
       "max": 100000000000
     },
     "error_message": "Revenue must be positive and reasonable"
   }
   ```

2. **type**: Validates data type
   ```json
   {
     "type": "type",
     "params": {
       "expected_type": "number"
     },
     "error_message": "Value must be a number"
   }
   ```

3. **format**: Validates format (e.g., date, email)
   ```json
   {
     "type": "format",
     "params": {
       "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
     },
     "error_message": "Date must be in YYYY-MM-DD format"
   }
   ```

4. **required**: Validates presence
   ```json
   {
     "type": "required",
     "params": {},
     "error_message": "This field is required"
   }
   ```

5. **custom**: Custom validation logic
   ```json
   {
     "type": "custom",
     "params": {
       "validator": "custom_function_name"
     },
     "error_message": "Custom validation failed"
   }
   ```

## Domain Values

The `domain` field must be one of:
- `"students"`
- `"faculty"`
- `"research"`
- `"administrative_staff"`
- `"operations"`
- `"finance"`

## Unit Values

Common unit values:
- `"currency"` - Monetary values
- `"percentage"` - Percentages (0-100)
- `"count"` - Integer counts
- `"ratio"` - Ratios
- `"text"` - Text values

## Example Requests

### cURL - Create Metric

```bash
curl -X POST "http://localhost:8000/api/v1/glossary/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "metric-tuition-revenue",
    "domain": "finance",
    "name": "Net Tuition Revenue",
    "canonical_name": "Net Tuition Revenue",
    "description": "Tuition and fee revenue after institutional scholarships and discounts",
    "calculation_logic": "Gross tuition - institutional aid",
    "data_owner": "Finance Department",
    "source": "internal-document",
    "update_frequency": "annual",
    "unit": "currency",
    "semantic_variations": [
      "Net Tuition",
      "Tuition Revenue",
      "Net Tuition and Fees"
    ],
    "validation_rules": [
      {
        "type": "range",
        "params": {"min": 0},
        "error_message": "Tuition revenue must be positive"
      }
    ],
    "entities": ["Institution"],
    "dimensions": ["FiscalYear"],
    "version": "1.0",
    "effective_date": "2024-01-01",
    "is_active": true
  }'
```

### cURL - Update Metric

```bash
curl -X PUT "http://localhost:8000/api/v1/glossary/metrics/metric-tuition-revenue" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "metric-tuition-revenue",
    "domain": "finance",
    "name": "Net Tuition Revenue",
    "canonical_name": "Net Tuition Revenue",
    "description": "Updated description",
    "calculation_logic": "Updated calculation logic",
    "data_owner": "Finance Department",
    "source": "internal-document",
    "update_frequency": "quarterly",
    "unit": "currency",
    "semantic_variations": [
      "Net Tuition",
      "Tuition Revenue",
      "Net Tuition and Fees",
      "Tuition Income"
    ],
    "validation_rules": [
      {
        "type": "range",
        "params": {"min": 0},
        "error_message": "Tuition revenue must be positive"
      }
    ],
    "entities": ["Institution"],
    "dimensions": ["FiscalYear", "DocumentType"],
    "version": "1.1",
    "effective_date": "2024-01-01",
    "is_active": true
  }'
```

### JavaScript/TypeScript

```typescript
const metric = {
  id: "metric-total-revenue",
  domain: "finance",
  name: "Total Operating Revenue",
  canonical_name: "Total Operating Revenue",
  description: "Total revenue from all operating sources",
  calculation_logic: "Sum of all operating revenue line items",
  data_owner: "Finance Department",
  source: "internal-document",
  update_frequency: "annual",
  unit: "currency",
  semantic_variations: [
    "Total Revenue",
    "Gross Revenue",
    "Operating Revenue"
  ],
  validation_rules: [
    {
      type: "range",
      params: { min: 0, max: 100000000000 },
      error_message: "Revenue must be positive and reasonable"
    }
  ],
  entities: ["Institution"],
  dimensions: ["FiscalYear", "DocumentType"],
  version: "1.0",
  effective_date: "2024-01-01",
  is_active: true
};

// Create
await fetch("http://localhost:8000/api/v1/glossary/metrics", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(metric)
});

// Update
await fetch(`http://localhost:8000/api/v1/glossary/metrics/${metric.id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(metric)
});
```

### Python

```python
import requests

metric = {
    "id": "metric-total-revenue",
    "domain": "finance",
    "name": "Total Operating Revenue",
    "canonical_name": "Total Operating Revenue",
    "description": "Total revenue from all operating sources",
    "calculation_logic": "Sum of all operating revenue line items",
    "data_owner": "Finance Department",
    "source": "internal-document",
    "update_frequency": "annual",
    "unit": "currency",
    "semantic_variations": [
        "Total Revenue",
        "Gross Revenue",
        "Operating Revenue"
    ],
    "validation_rules": [
        {
            "type": "range",
            "params": {"min": 0, "max": 100000000000},
            "error_message": "Revenue must be positive and reasonable"
        }
    ],
    "entities": ["Institution"],
    "dimensions": ["FiscalYear", "DocumentType"],
    "version": "1.0",
    "effective_date": "2024-01-01",
    "is_active": True
}

# Create
response = requests.post(
    "http://localhost:8000/api/v1/glossary/metrics",
    json=metric,
    headers={"Content-Type": "application/json"}
)

# Update
response = requests.put(
    f"http://localhost:8000/api/v1/glossary/metrics/{metric['id']}",
    json=metric,
    headers={"Content-Type": "application/json"}
)
```

## Response Format

Both create and update endpoints return the saved metric in the same format:

```json
{
  "id": "metric-total-revenue",
  "domain": "finance",
  "name": "Total Operating Revenue",
  "canonical_name": "Total Operating Revenue",
  "description": "Total revenue from all operating sources",
  "calculation_logic": "Sum of all operating revenue line items",
  "data_owner": "Finance Department",
  "source": "internal-document",
  "update_frequency": "annual",
  "unit": "currency",
  "semantic_variations": ["Total Revenue", "Gross Revenue"],
  "validation_rules": [...],
  "entities": ["Institution"],
  "dimensions": ["FiscalYear", "DocumentType"],
  "version": "1.0",
  "effective_date": "2024-01-01",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "is_active": true
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Metric ID in path must match metric ID in body"
}
```

### 404 Not Found
```json
{
  "detail": "Metric 'metric-id' not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to save metric to glossary"
}
```

## Notes

1. **Dimensions**: The `dimensions` array should contain dimension names/IDs that exist in your dimensions glossary (e.g., "FiscalYear", "DocumentType"). These are used for filtering and validation during extraction.

2. **Entities**: The `entities` array typically contains entity types like "Institution", "Department", etc. These define what types of entities this metric can be measured for.

3. **Semantic Variations**: These are alternative names that help the AI matcher find this metric even when documents use different wording.

4. **Timestamps**: `created_at` and `updated_at` are automatically managed. When updating, `created_at` is preserved from the existing metric if not provided.

5. **ID Format**: Metric IDs should be unique and follow a consistent pattern (e.g., `metric-{domain}-{name}`). They cannot be changed after creation.
