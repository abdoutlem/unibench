# PDF Upload Implementation

## Overview

PDF files are now properly uploaded to the backend and stored on disk. The system supports:
- Single file uploads
- Batch file uploads
- Progress tracking
- File metadata storage
- Extraction from uploaded files

## Backend Implementation

### Upload Endpoints

1. **POST `/api/v1/upload`** - Upload a single file
   - Accepts: `file` (multipart/form-data), optional `folder_id`
   - Returns: File metadata with unique ID
   - Saves file to `./uploads/` directory

2. **POST `/api/v1/upload/batch`** - Upload multiple files
   - Accepts: `files[]` (multipart/form-data), optional `folder_id`
   - Returns: Array of file metadata
   - Handles errors gracefully (continues with successful uploads)

3. **GET `/api/v1/upload`** - List uploaded files
   - Optional query: `folder_id` to filter by folder
   - Returns: Array of file metadata

4. **GET `/api/v1/upload/{file_id}`** - Get file metadata
   - Returns: File metadata

5. **DELETE `/api/v1/upload/{file_id}`** - Delete uploaded file
   - Removes file from disk and metadata store

6. **GET `/api/v1/upload/{file_id}/content`** - Get file content
   - Returns: File binary content for extraction

### File Storage

- Files are saved to: `./uploads/` (configurable via `UPLOAD_DIR` in `.env`)
- Filename format: `{file_id}_{original_filename}`
- Maximum file size: 50MB (configurable via `MAX_UPLOAD_SIZE`)
- Supported formats: PDF, Excel, Word, PowerPoint, CSV, Text

## Frontend Implementation

### Upload Flow

1. **User selects files** via drag-and-drop or file picker
2. **Files are uploaded** to backend API (`/api/v1/upload`)
3. **Progress is tracked** for each file
4. **Documents are created** in the store from uploaded file metadata
5. **Files can be extracted** using the file ID

### API Client Methods

```typescript
// Upload single file
await apiClient.uploadFile(file, folderId?)

// Upload multiple files
await apiClient.uploadFiles(files[], folderId?)

// Get uploaded file metadata
await apiClient.getUploadedFile(fileId)

// List uploaded files
await apiClient.listUploadedFiles(folderId?)

// Delete uploaded file
await apiClient.deleteUploadedFile(fileId)
```

### Extraction from Uploaded Files

The extraction endpoint now supports both:
- **Direct file upload**: `POST /api/v1/extract` with `file` parameter
- **Uploaded file ID**: `POST /api/v1/extract` with `file_id` parameter

```typescript
// Extract from uploaded file
const formData = new FormData();
formData.append("rule_ids", "rule-total-revenue");
formData.append("method", "HYBRID");
formData.append("file_id", uploadedFileId);
```

## Usage

### Upload Files via Frontend

1. Go to Documents page
2. Click "Upload Files" button
3. Select files or drag-and-drop
4. Files are uploaded automatically
5. Progress is shown for each file
6. Documents appear in the list when upload completes

### Extract Data from Uploaded Files

1. Find uploaded document in the list
2. Click the three-dot menu (⋮)
3. Select "Extract Data"
4. Choose extraction rules and method
5. Click "Extract Data"
6. Results are displayed

### Upload via API

```bash
# Single file
curl -X POST "http://localhost:8000/api/v1/upload" \
  -F "file=@document.pdf" \
  -F "folder_id=optional-folder-id"

# Multiple files
curl -X POST "http://localhost:8000/api/v1/upload/batch" \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf"
```

## File Metadata

Each uploaded file has:
- `id`: Unique file identifier
- `filename`: Original filename
- `file_type`: File extension (pdf, xlsx, etc.)
- `size`: File size in bytes
- `upload_path`: Path where file is stored
- `uploaded_at`: ISO timestamp
- `folder_id`: Optional folder association
- `status`: Upload status

## Error Handling

- **File size exceeded**: Returns 413 error with max size message
- **Unsupported file type**: Returns 400 error with supported types
- **Upload failure**: File marked as error, other uploads continue
- **Network errors**: Displayed in UI, retry possible

## Testing

1. **Start backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start frontend**:
   ```bash
   npm run dev
   ```

3. **Upload a PDF**:
   - Go to Documents page
   - Click "Upload Files"
   - Select a PDF file
   - Wait for upload to complete

4. **Verify upload**:
   - Check `backend/uploads/` directory
   - File should be saved with format: `file-{id}_{filename}`

5. **Extract data**:
   - Click "Extract Data" on uploaded document
   - Select rules and method
   - View extraction results

## Next Steps

- [ ] Add database persistence for file metadata
- [ ] Implement file versioning
- [ ] Add file preview functionality
- [ ] Support for file organization (folders, tags)
- [ ] Add file search and filtering
- [ ] Implement file sharing/permissions
