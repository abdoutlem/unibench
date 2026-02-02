# Glossary Management Guide

This guide explains how to add, update, and manage metrics in the glossary system.

## Overview

The glossary system stores metric definitions in YAML files and automatically uses them for AI-powered extraction. When you add or update metrics, they are immediately available for extraction.

## Adding Metrics

### Method 1: Via API (Recommended)

Use the REST API to create metrics programmatically:

```bash
curl -X POST "http://localhost:8000/api/v1/glossary/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "metric-custom-revenue",
    "domain": "finance",
    "name": "Custom Revenue Metric",
    "canonical_name": "Custom Revenue Metric",
    "description": "A custom revenue metric for specific reporting",
    "calculation_logic": "Sum of revenue line items A, B, and C",
    "data_owner": "Finance Department",
    "source": "internal-document",
    "update_frequency": "quarterly",
    "unit": "currency",
    "semantic_variations": [
      "Custom Revenue",
      "Special Revenue",
      "Revenue Custom"
    ],
    "validation_rules": [
      {
        "type": "range",
        "params": {"min": 0},
        "error_message": "Revenue must be positive"
      }
    ],
    "entities": ["Institution"],
    "dimensions": ["FiscalYear", "DocumentType"],
    "version": "1.0",
    "effective_date": "2024-01-01",
    "is_active": true
  }'
```

### Method 2: Via Frontend API Client

```typescript
import { apiClient } from "@/lib/api";

const newMetric = {
  id: "metric-custom-revenue",
  domain: "finance",
  name: "Custom Revenue Metric",
  canonical_name: "Custom Revenue Metric",
  description: "A custom revenue metric",
  calculation_logic: "Sum of revenue line items",
  data_owner: "Finance Department",
  source: "internal-document",
  update_frequency: "quarterly",
  unit: "currency",
  semantic_variations: ["Custom Revenue", "Special Revenue"],
  validation_rules: [],
  entities: ["Institution"],
  dimensions: ["FiscalYear"],
  version: "1.0",
  effective_date: "2024-01-01",
  is_active: true
};

await apiClient.createGlossaryMetric(newMetric);
```

### Method 3: Direct YAML Editing

Edit `backend/app/data/glossary/metrics.yaml` directly:

```yaml
metrics:
  - id: "metric-custom-revenue"
    domain: "finance"
    name: "Custom Revenue Metric"
    canonical_name: "Custom Revenue Metric"
    description: "A custom revenue metric"
    calculation_logic: "Sum of revenue line items"
    data_owner: "Finance Department"
    source: "internal-document"
    update_frequency: "quarterly"
    unit: "currency"
    semantic_variations:
      - "Custom Revenue"
      - "Special Revenue"
    validation_rules:
      - type: "range"
        params:
          min: 0
        error_message: "Revenue must be positive"
    entities:
      - "Institution"
    dimensions:
      - "FiscalYear"
      - "DocumentType"
    version: "1.0"
    effective_date: "2024-01-01"
```

After editing YAML, reload the glossary:
- Restart the backend server, OR
- Call the reload endpoint (if implemented)

## Updating Metrics

### Via API

```bash
curl -X PUT "http://localhost:8000/api/v1/glossary/metrics/metric-custom-revenue" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "metric-custom-revenue",
    "domain": "finance",
    "name": "Updated Custom Revenue Metric",
    "canonical_name": "Updated Custom Revenue Metric",
    "description": "Updated description",
    "calculation_logic": "Updated calculation",
    "data_owner": "Finance Department",
    "source": "internal-document",
    "update_frequency": "monthly",
    "unit": "currency",
    "semantic_variations": ["Updated Revenue"],
    "validation_rules": [],
    "entities": ["Institution"],
    "dimensions": ["FiscalYear"],
    "version": "1.1",
    "effective_date": "2024-02-01",
    "is_active": true
  }'
```

## Deleting Metrics

Metrics are not actually deleted, but marked as inactive:

```bash
curl -X DELETE "http://localhost:8000/api/v1/glossary/metrics/metric-custom-revenue"
```

## Metric Fields

### Required Fields

- `id`: Unique identifier (e.g., "metric-custom-revenue")
- `domain`: One of: students, faculty, research, administrative_staff, operations, finance
- `name`: Display name
- `canonical_name`: Standard name for matching
- `description`: What this metric represents
- `calculation_logic`: How to calculate this metric
- `data_owner`: Who owns this metric
- `source`: Data source (internal-document, ipeds, etc.)
- `update_frequency`: How often updated (annual, quarterly, monthly, etc.)
- `unit`: Unit of measurement (currency, percentage, count, ratio, etc.)
- `effective_date`: When this definition became effective (YYYY-MM-DD)

### Optional Fields

- `semantic_variations`: List of alternative names/phrasings
- `validation_rules`: List of validation rules
- `entities`: List of entity types this applies to
- `dimensions`: List of dimension types
- `version`: Version string (default: "1.0")
- `is_active`: Whether metric is active (default: true)

## How AI Uses Glossary Metrics

When you extract data:

1. **Glossary Loading**: All active metrics are loaded from the glossary
2. **AI Prompt Enhancement**: The AI receives:
   - Metric definitions
   - Calculation logic
   - Semantic variations
   - Domain context
3. **Matching**: Extracted text is matched to glossary metrics using fuzzy matching
4. **Validation**: Extracted values are validated against glossary rules
5. **Storage**: Results are stored with domain classification

## Best Practices

1. **Use Descriptive IDs**: Use clear, consistent naming (e.g., `metric-total-revenue`)
2. **Add Semantic Variations**: Include common alternative names/phrasings
3. **Define Validation Rules**: Add range/type validation for data quality
4. **Specify Calculation Logic**: Document how the metric is calculated
5. **Set Data Owner**: Identify who is responsible for this metric
6. **Version Control**: Increment version when making significant changes

## Example: Adding a Student Enrollment Metric

```json
{
  "id": "metric-fall-enrollment",
  "domain": "students",
  "name": "Fall Semester Enrollment",
  "canonical_name": "Fall Semester Enrollment",
  "description": "Total headcount enrollment in fall semester",
  "calculation_logic": "Sum of all enrolled students as of census date",
  "data_owner": "Registrar's Office",
  "source": "internal-document",
  "update_frequency": "annual",
  "unit": "count",
  "semantic_variations": [
    "Fall Enrollment",
    "Fall Headcount",
    "Fall Student Count",
    "Enrollment Fall"
  ],
  "validation_rules": [
    {
      "type": "range",
      "params": {"min": 0},
      "error_message": "Enrollment must be positive"
    }
  ],
  "entities": ["Institution"],
  "dimensions": ["FiscalYear"],
  "version": "1.0",
  "effective_date": "2024-01-01",
  "is_active": true
}
```

## Testing Your Metrics

After adding a metric:

1. **Verify it's loaded**:
   ```bash
   curl "http://localhost:8000/api/v1/glossary/metrics/metric-fall-enrollment"
   ```

2. **Test matching**:
   ```bash
   curl "http://localhost:8000/api/v1/glossary/match?text=Fall%20Enrollment"
   ```

3. **Extract with the metric**:
   - Create an extraction rule that targets your metric ID
   - Upload a document containing the metric
   - Run extraction and verify the AI uses your glossary definition

## Troubleshooting

### Metric not appearing in extraction

1. Check metric is active: `is_active: true`
2. Verify glossary was reloaded (restart server or call reload)
3. Check extraction rule targets correct `metric_id`
4. Verify semantic variations match document text

### AI not recognizing metric

1. Add more semantic variations
2. Check domain matches document context
3. Verify calculation logic is clear
4. Test matching endpoint to see confidence scores

## API Reference

- `GET /api/v1/glossary/metrics` - List all metrics
- `GET /api/v1/glossary/metrics/{id}` - Get specific metric
- `POST /api/v1/glossary/metrics` - Create new metric
- `PUT /api/v1/glossary/metrics/{id}` - Update metric
- `DELETE /api/v1/glossary/metrics/{id}` - Deactivate metric
- `GET /api/v1/glossary/match?text=...` - Test text matching
