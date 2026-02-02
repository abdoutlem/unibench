"""File upload endpoints."""

import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for Phase 0 (replace with database later)
uploaded_files_db: dict[str, dict] = {}


class UploadedFileResponse(BaseModel):
    """Response model for uploaded file."""
    id: str
    filename: str
    file_type: str
    size: int
    upload_path: str
    uploaded_at: str
    status: str = "uploaded"


@router.post("", response_model=UploadedFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None)
):
    """Upload a file to the server."""
    # #region agent log
    import json
    try:
        with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"upload-debug","hypothesisId":"A","location":"upload.py:40","message":"Upload endpoint called","data":{"filename":file.filename if file else None,"has_folder_id":folder_id is not None},"timestamp":int(__import__("time").time()*1000)})+"\n")
    except: pass
    # #endregion
    logger.info(f"Upload request: file={file.filename}, size={file.size if hasattr(file, 'size') else 'unknown'}")
    
    # Validate file size
    # #region agent log
    try:
        with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"upload-debug","hypothesisId":"B","location":"upload.py:43","message":"About to read file content","data":{"filename":file.filename},"timestamp":int(__import__("time").time()*1000)})+"\n")
    except: pass
    # #endregion
    content = await file.read()
    file_size = len(content)
    # #region agent log
    try:
        with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"upload-debug","hypothesisId":"B","location":"upload.py:46","message":"File content read","data":{"file_size":file_size,"max_size":settings.max_upload_size},"timestamp":int(__import__("time").time()*1000)})+"\n")
    except: pass
    # #endregion
    
    if file_size > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size of {settings.max_upload_size / (1024 * 1024):.1f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    supported_extensions = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'csv', 'txt']
    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported types: {', '.join(supported_extensions)}"
        )
    
    # Generate unique file ID and save path
    file_id = f"file-{uuid.uuid4().hex[:8]}"
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Create safe filename
    safe_filename = f"{file_id}_{file.filename}"
    file_path = upload_dir / safe_filename
    
    # Save file
    try:
        # #region agent log
        try:
            with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"upload-debug","hypothesisId":"C","location":"upload.py:78","message":"About to save file","data":{"file_path":str(file_path),"upload_dir":str(upload_dir),"dir_exists":upload_dir.exists()},"timestamp":int(__import__("time").time()*1000)})+"\n")
        except: pass
        # #endregion
        with open(file_path, "wb") as f:
            f.write(content)
        # #region agent log
        try:
            with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"upload-debug","hypothesisId":"C","location":"upload.py:81","message":"File saved successfully","data":{"file_path":str(file_path),"file_exists":file_path.exists()},"timestamp":int(__import__("time").time()*1000)})+"\n")
        except: pass
        # #endregion
        logger.info(f"File saved: {file_path}")
    except Exception as e:
        # #region agent log
        try:
            with open("/home/arhmaritlemcani/Dev/unibench/.cursor/debug.log", "a") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"upload-debug","hypothesisId":"C","location":"upload.py:84","message":"Error saving file","data":{"error":str(e),"error_type":type(e).__name__},"timestamp":int(__import__("time").time()*1000)})+"\n")
        except: pass
        # #endregion
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Store metadata
    file_metadata = {
        "id": file_id,
        "filename": file.filename,
        "file_type": file_ext,
        "size": file_size,
        "upload_path": str(file_path),
        "uploaded_at": datetime.utcnow().isoformat(),
        "folder_id": folder_id,
        "status": "uploaded"
    }
    
    uploaded_files_db[file_id] = file_metadata
    
    logger.info(f"File uploaded successfully: {file_id} ({file.filename})")
    
    return UploadedFileResponse(**file_metadata)


@router.post("/upload/batch", response_model=list[UploadedFileResponse])
async def upload_files_batch(
    files: list[UploadFile] = File(...),
    folder_id: Optional[str] = Form(None)
):
    """Upload multiple files at once."""
    logger.info(f"Batch upload request: {len(files)} files")
    
    results = []
    errors = []
    
    for file in files:
        try:
            # Read file content
            content = await file.read()
            
            # Validate file size
            file_size = len(content)
            if file_size > settings.max_upload_size:
                errors.append({"filename": file.filename or "unknown", "error": f"File size exceeds {settings.max_upload_size / (1024 * 1024):.1f}MB"})
                continue
            
            if file_size == 0:
                errors.append({"filename": file.filename or "unknown", "error": "File is empty"})
                continue
            
            # Validate file type
            if not file.filename:
                errors.append({"filename": "unknown", "error": "Filename is required"})
                continue
            
            file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
            supported_extensions = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'csv', 'txt']
            if file_ext not in supported_extensions:
                errors.append({"filename": file.filename, "error": f"Unsupported file type: {file_ext}"})
                continue
            
            # Generate unique file ID and save path
            file_id = f"file-{uuid.uuid4().hex[:8]}"
            upload_dir = Path(settings.upload_dir)
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            # Create safe filename
            safe_filename = f"{file_id}_{file.filename}"
            file_path = upload_dir / safe_filename
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Store metadata
            file_metadata = {
                "id": file_id,
                "filename": file.filename,
                "file_type": file_ext,
                "size": file_size,
                "upload_path": str(file_path),
                "uploaded_at": datetime.utcnow().isoformat(),
                "folder_id": folder_id,
                "status": "uploaded"
            }
            
            uploaded_files_db[file_id] = file_metadata
            results.append(UploadedFileResponse(**file_metadata))
            
        except Exception as e:
            logger.error(f"Error uploading {file.filename}: {e}")
            errors.append({"filename": file.filename or "unknown", "error": str(e)})
    
    if errors and not results:
        raise HTTPException(status_code=400, detail=f"All uploads failed: {errors}")
    
    if errors:
        logger.warning(f"Some uploads failed: {errors}")
    
    return results


@router.get("/upload/{file_id}", response_model=UploadedFileResponse)
async def get_uploaded_file(file_id: str):
    """Get metadata for an uploaded file."""
    if file_id not in uploaded_files_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    return UploadedFileResponse(**uploaded_files_db[file_id])


@router.get("/upload", response_model=list[UploadedFileResponse])
async def list_uploaded_files(
    folder_id: Optional[str] = None
):
    """List all uploaded files."""
    files = list(uploaded_files_db.values())
    
    if folder_id:
        files = [f for f in files if f.get("folder_id") == folder_id]
    
    return [UploadedFileResponse(**f) for f in files]


@router.delete("/upload/{file_id}")
async def delete_uploaded_file(file_id: str):
    """Delete an uploaded file."""
    if file_id not in uploaded_files_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_metadata = uploaded_files_db[file_id]
    file_path = Path(file_metadata["upload_path"])
    
    # Delete file from disk
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info(f"File deleted from disk: {file_path}")
    except Exception as e:
        logger.error(f"Error deleting file from disk: {e}")
    
    # Remove from database
    del uploaded_files_db[file_id]
    
    return {"status": "deleted", "file_id": file_id}


@router.get("/upload/{file_id}/content")
async def get_file_content(file_id: str):
    """Get the actual file content for extraction."""
    if file_id not in uploaded_files_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_metadata = uploaded_files_db[file_id]
    file_path = Path(file_metadata["upload_path"])
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        
        return {
            "file_id": file_id,
            "filename": file_metadata["filename"],
            "content": content,
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
