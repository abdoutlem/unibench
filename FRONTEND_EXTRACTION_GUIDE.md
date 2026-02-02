# Frontend Data Extraction Guide

This guide explains how to extract data from files using the UniBench web platform.

## Prerequisites

1. **Backend Server Running**: Make sure the backend API is running on `http://localhost:8000`
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend Running**: Start the Next.js frontend
   ```bash
   npm run dev
   ```

3. **Environment Variable** (Optional): If your backend is on a different URL, set:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

## How to Extract Data from Files

### Method 1: Extract from Uploaded Documents

1. **Navigate to Documents Page**
   - Go to the Documents section in the navigation menu

2. **Find the Document**
   - Browse through your documents list
   - Find the document you want to extract data from

3. **Click Extract**
   - Click the three-dot menu (⋮) next to the document
   - Select "Extract Data" from the dropdown menu

4. **Select Extraction Rules**
   - A dialog will open showing available extraction rules
   - Select one or more rules you want to apply:
     - **Total Operating Revenue** (`rule-total-revenue`)
     - **Net Income** (`rule-net-income`)
     - **Total Assets** (`rule-total-assets`)
     - **Employee Count** (`rule-employee-count`)
     - **Total Enrollment** (`rule-enrollment`)

5. **Choose Extraction Method**
   - **HYBRID** (Recommended): Uses both rule-based and AI extraction
   - **RULE_BASED**: Uses only pattern matching and regex
   - **AI**: Uses only AI extraction (requires API keys)

6. **Click "Extract Data"**
   - The system will process your file
   - Results will appear in the dialog showing:
     - Extracted values
     - Normalized values
     - Confidence scores
     - Status (pending review, approved, rejected)

### Method 2: Extract During Upload

Currently, the upload process stores files. After upload completes, you can extract data using Method 1 above.

## Understanding Extraction Results

### Result Display

Each extraction result shows:
- **Metric Name**: The name of the extracted metric
- **Extracted Value**: The raw value found in the document
- **Normalized Value**: The value converted to a standard format
- **Confidence**: Percentage indicating how confident the extraction is (0-100%)
- **Status**: 
  - `pending_review`: Needs manual verification
  - `approved`: Verified and approved
  - `rejected`: Marked as incorrect

### Example Result

```
Total Operating Revenue
Value: $1,234,567,890
(Normalized: 1,234,567,890)
Confidence: 95%
Status: pending review
```

## Supported File Types

The platform supports extraction from:
- **PDF** (`.pdf`)
- **Excel** (`.xlsx`, `.xls`)
- **Word** (`.docx`, `.doc`)
- **PowerPoint** (`.pptx`, `.ppt`)
- **CSV** (`.csv`)
- **Text** (`.txt`)

## Troubleshooting

### "Failed to load extraction rules"
- **Solution**: Make sure the backend server is running and accessible
- Check browser console for detailed error messages
- Verify `NEXT_PUBLIC_API_URL` is set correctly

### "Failed to extract data from file"
- **Solution**: 
  - Check that the file format is supported
  - Ensure the file size is under 50MB
  - Verify at least one extraction rule is selected
  - Check backend logs for detailed errors

### "No results found"
- **Solution**:
  - Try selecting different extraction rules
  - Switch to HYBRID method for better results
  - Ensure the document contains the data you're looking for
  - Check that the document text is readable (not scanned images)

### Extraction Dialog Not Appearing
- **Solution**:
  - Check browser console for errors
  - Ensure you clicked "Extract Data" from the document menu
  - Refresh the page and try again

## Tips for Best Results

1. **Use HYBRID Method**: Combines rule-based and AI extraction for best accuracy

2. **Select Multiple Rules**: Extract multiple metrics at once by selecting multiple rules

3. **Review Results**: Always review extraction results, especially those with low confidence scores

4. **File Quality**: 
   - Use text-based PDFs (not scanned images)
   - Ensure documents are well-formatted
   - Avoid corrupted or password-protected files

5. **Rule Selection**: 
   - Select rules that match the type of document you're processing
   - Financial documents → Revenue, Income, Assets rules
   - Enrollment documents → Enrollment rule
   - HR documents → Employee Count rule

## API Integration

If you want to integrate extraction into your own components, you can use the API client:

```typescript
import { apiClient } from "@/lib/api";

// Extract from file
const job = await apiClient.extractFromFile(
  file,
  ["rule-total-revenue", "rule-net-income"],
  "HYBRID"
);

// Get available rules
const rules = await apiClient.getRules();

// Get extraction results
const results = await apiClient.getResults(job.id);
```

## Next Steps

After extraction:
1. Review the extracted values
2. Approve or reject results as needed
3. The extracted metrics will be available for use in benchmarks and comparisons
4. You can export results or use them in other parts of the platform
