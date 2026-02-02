# Fix for 422 Unprocessable Entity Error

## Problem

The `/api/v1/extract` endpoint was returning 422 errors when trying to extract data from uploaded files using `file_id`.

## Root Cause

1. **File Parameter Required**: The endpoint had `file: UploadFile = File(...)` which made the file parameter required, but when using `file_id`, no file is sent.

2. **Method Enum Parsing**: The method parameter was being sent as "HYBRID" (uppercase) but the backend enum expects "hybrid" (lowercase).

3. **Form Data Validation**: FastAPI's form validation was strict about optional File fields.

## Solution

### Backend Changes

1. **Made file parameter optional**:
   ```python
   file: Optional[UploadFile] = File(None)
   ```

2. **Accept method as string and convert to enum**:
   ```python
   method: str = Form("hybrid")
   # Then convert: method_enum = ExtractionMethod(method.lower())
   ```

3. **Added validation**:
   - Ensures either `file` or `file_id` is provided
   - Better error messages for debugging

### Frontend Changes

1. **Convert method to lowercase**:
   ```typescript
   formData.append("method", method.toLowerCase());
   ```

2. **Fixed method conversion in API client**:
   ```typescript
   const methodValue = method.toLowerCase();
   formData.append("method", methodValue);
   ```

## Testing

To test the fix:

1. **Start backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Test with file_id**:
   ```bash
   # First upload a file
   curl -X POST "http://localhost:8000/api/v1/upload" \
     -F "file=@test.pdf"
   
   # Then extract using file_id
   curl -X POST "http://localhost:8000/api/v1/extract" \
     -F "rule_ids=rule-total-revenue" \
     -F "method=hybrid" \
     -F "file_id=file-abc123"
   ```

3. **Test with direct file**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/extract" \
     -F "file=@test.pdf" \
     -F "rule_ids=rule-total-revenue" \
     -F "method=hybrid"
   ```

## Method Values

The backend accepts these method values (case-insensitive):
- `hybrid` or `HYBRID` → `hybrid`
- `rule_based` or `RULE_BASED` → `rule_based`
- `ai` or `AI` → `ai`

## Error Messages

If you still get 422 errors, check:

1. **Missing file/file_id**: "Either 'file' or 'file_id' must be provided"
2. **Invalid method**: "Invalid method 'X'. Must be one of: ['hybrid', 'rule_based', 'ai']"
3. **Missing rule_ids**: Check that rule_ids is provided and not empty
4. **Invalid file_id**: "File not found" (404) if file_id doesn't exist

## Debugging

Check backend logs for detailed information:
```
2024-01-28 17:50:00 - app.api.routes - INFO - Extraction request: file=None, file_id=file-abc123, method=hybrid, rules=rule-total-revenue
```

If you see errors in the logs, they will show exactly what's wrong with the request.
