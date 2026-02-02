# PDF Extraction Improvements

## Overview

Enhanced the PDF extraction system with PyMuPDF, improved logging, and proper extraction method handling.

## Key Improvements

### 1. Enhanced PyMuPDF Integration

- **Better Text Extraction**: Uses both `get_text("text")` and `get_text("blocks")` for improved layout preservation
- **Table Extraction**: Properly extracts tables using PyMuPDF's `find_tables()` method
- **Error Handling**: Comprehensive error handling with fallback to mock parser if PyMuPDF is not available
- **Metadata**: Tracks page count, table count, character count, and parser used

### 2. Comprehensive Logging

All extraction steps now log detailed information:

- **Document Parsing**: Logs file info, page count, table count, text length
- **Text Preview**: Shows first 1000 characters of extracted text for debugging
- **Rule Application**: Logs which rules are being applied
- **Method Selection**: Shows which extraction method is being used (RULE_BASED, AI, HYBRID)
- **Results**: Logs confidence scores, extracted values, and source patterns

### 3. Extraction Method Implementation

The system now properly respects extraction methods:

- **RULE_BASED**: Only uses pattern matching and regex rules
- **AI**: Only uses AI extraction (requires API keys)
- **HYBRID**: 
  - First tries rule-based extraction
  - If no results or confidence < 0.8, falls back to AI
  - Returns the best result

### 4. New Preview Endpoint

Added `/api/v1/extract/preview` endpoint to see extracted text before applying rules:

```bash
curl -X POST "http://localhost:8000/api/v1/extract/preview" \
  -F "file=@document.pdf"
```

Returns:
- Extracted text preview (first 5000 characters)
- Full text length
- Page count
- Table count
- First few pages and tables

## Usage

### 1. Test Extraction Locally

Use the test script to see extraction in action:

```bash
cd backend
python test_extraction.py /path/to/your/document.pdf
```

This will show:
1. PDF parsing results
2. Extracted text preview
3. Page breakdown
4. Tables found
5. Extraction results for RULE_BASED method
6. Extraction results for HYBRID method

### 2. View Logs During Extraction

When running the API server, you'll see detailed logs:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Example log output:
```
2024-01-28 17:50:00 - app.services.document_parser - INFO - Parsing PDF: document.pdf (5 pages)
2024-01-28 17:50:01 - app.services.document_parser - INFO - Page 1: Extracted 1234 characters
2024-01-28 17:50:01 - app.services.document_parser - INFO - Page 1: Found 2 tables
2024-01-28 17:50:02 - app.services.document_parser - INFO - PDF parsing complete: 5678 total characters, 2 tables
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Processing document: document.pdf with method: HYBRID
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Step 1: Parsing document...
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Document parsed: document.pdf (pdf)
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Extracted text length: 5678 characters
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Extracted text preview (first 1000 chars): Financial Report 2024 Total Operating Revenue...
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Step 2: Applying extraction rules...
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Rule 1/1: Total Operating Revenue (ID: rule-total-revenue)
2024-01-28 17:50:02 - app.services.extraction_service - DEBUG - Extraction method: HYBRID, use_rules=True, use_ai=True
2024-01-28 17:50:02 - app.services.extraction_service - DEBUG - Applying rule-based extraction for: Total Operating Revenue
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Best rule-based result: $1,234,567,890 (confidence: 0.95)
2024-01-28 17:50:02 - app.services.extraction_service - INFO - Final result for Total Operating Revenue: $1,234,567,890 (confidence: 0.95)
```

### 3. Preview Extracted Text

Before applying extraction rules, preview what was extracted:

```bash
curl -X POST "http://localhost:8000/api/v1/extract/preview" \
  -F "file=@document.pdf" | jq
```

### 4. Extract with Different Methods

**Rule-Based Only:**
```bash
curl -X POST "http://localhost:8000/api/v1/extract" \
  -F "file=@document.pdf" \
  -F "rule_ids=rule-total-revenue" \
  -F "method=RULE_BASED"
```

**AI Only:**
```bash
curl -X POST "http://localhost:8000/api/v1/extract" \
  -F "file=@document.pdf" \
  -F "rule_ids=rule-total-revenue" \
  -F "method=AI"
```

**Hybrid (Recommended):**
```bash
curl -X POST "http://localhost:8000/api/v1/extract" \
  -F "file=@document.pdf" \
  -F "rule_ids=rule-total-revenue" \
  -F "method=HYBRID"
```

## Extraction Flow

1. **Document Upload**: File is validated (size, type)
2. **PDF Parsing**: PyMuPDF extracts text and tables
3. **Logging**: Extracted data is logged for review
4. **Rule Application**: Selected extraction rules are applied
5. **Method Execution**: 
   - RULE_BASED: Pattern matching only
   - AI: AI extraction only
   - HYBRID: Rule-based first, then AI if needed
6. **Results**: Best results are returned with confidence scores

## Testing

To test with a sample PDF:

1. **Create a test PDF** with financial data:
   ```
   Financial Report 2024
   Total Operating Revenue: $1,234,567,890
   Net Income: $500,000,000
   ```

2. **Run the test script**:
   ```bash
   python backend/test_extraction.py test.pdf
   ```

3. **Check the logs** to see:
   - What text was extracted
   - How many pages and tables were found
   - Which extraction method was used
   - What results were found

## Troubleshooting

### PyMuPDF Not Installed

If you see "PyMuPDF not installed" warnings:
```bash
pip install PyMuPDF
```

### No Text Extracted

- Check if PDF is text-based (not scanned images)
- Try a different PDF file
- Check logs for parsing errors

### Low Confidence Results

- Try HYBRID method for better results
- Ensure extraction rules match document content
- Check extracted text preview to verify data is present

### Extraction Method Not Working

- Verify method parameter: `RULE_BASED`, `AI`, or `HYBRID`
- Check logs to see which method is actually being used
- For AI method, ensure API keys are configured

## Next Steps

1. Test with real PDF files
2. Review extracted text in logs
3. Adjust extraction rules based on results
4. Use HYBRID method for best accuracy
5. Monitor confidence scores to identify areas for improvement
