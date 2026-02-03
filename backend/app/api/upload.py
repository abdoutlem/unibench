"""File upload endpoints."""

import os
import uuid
import logging
import httpx
import base64
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.core.config import settings
from app.models.webhook import N8NWebhookPayload

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
    source_id: Optional[str] = None  # Datasource ID for tracking
    datasource_id: Optional[str] = None  # Keep for backward compatibility


@router.post("", response_model=UploadedFileResponse, status_code=202)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None)
):
    """Upload a file - saves file and datasource, returns immediately (202 Accepted).
    
    External systems should call /api/v1/datasources/status-update with the source_id
    when processing is complete.
    """
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
    
    # Create datasource for the uploaded file
    datasource_id = None
    try:
        from app.api.datasources import datasources_db
        from app.models.datasource import DataSource, DataSourceType, DataSourceStatus, UpdateFrequency
        
        datasource_id = f"ds-{uuid.uuid4().hex[:12]}"
        datasource = DataSource(
            id=datasource_id,
            name=file.filename,
            type=DataSourceType.DOCUMENT,
            description=f"Uploaded document: {file.filename}",
            status=DataSourceStatus.PENDING,
            document_ids=[file_id],
            update_frequency=UpdateFrequency.MANUAL,
            auto_extract=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by="system"
        )
        datasources_db[datasource_id] = datasource
        logger.info(f"Created datasource {datasource_id} for file: {file_id}. Status: PENDING. External system should update status via /datasources/status-update")
        
        # Send POST request to external webhook with source_id (fire-and-forget)
        if settings.n8n_webhook_url:
            async def notify_external_system():
                try:
                    payload = {
                        "source_id": datasource_id,
                        "source_type": "document",
                        "file_id": file_id,
                        "filename": file.filename,
                        "file_type": file_ext,
                        "file_path": str(file_path),
                        "name": file.filename,
                        "description": f"Uploaded document: {file.filename}",
                        "status": "pending",
                        "status_update_url": f"{settings.api_base_url}{settings.api_prefix}/datasources/status-update"
                    }
                    async with httpx.AsyncClient(timeout=10) as client:
                        await client.post(
                            settings.n8n_webhook_url,
                            json=payload,
                            headers={"Content-Type": "application/json"}
                        )
                    logger.info(f"Notified external system about datasource {datasource_id}")
                except Exception as e:
                    logger.error(f"Error notifying external system about datasource {datasource_id}: {e}", exc_info=True)
                    # Don't fail the request if notification fails
            
            import asyncio
            asyncio.create_task(notify_external_system())
    except Exception as e:
        logger.error(f"Error creating datasource for file {file_id}: {e}", exc_info=True)
        # Don't fail the upload if datasource creation fails
    
    # Return response with source_id (202 Accepted)
    response_dict = file_metadata.copy()
    if datasource_id:
        response_dict["source_id"] = datasource_id
        response_dict["datasource_id"] = datasource_id  # Keep for backward compatibility
    
    return UploadedFileResponse(**response_dict)


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


async def _send_to_n8n(
    file_path: Optional[Path] = None,
    filename: Optional[str] = None,
    file_id: Optional[str] = None,
    file_type: Optional[str] = None,
    url: Optional[str] = None
) -> Optional[dict]:
    """Send document or URL to n8n and process the response."""
    if not settings.n8n_webhook_url:
        return None
    
    try:
        # Prepare payload for n8n
        payload = {}
        
        if url:
            # Send URL to n8n
            payload = {
                "url": url,
                "source_type": "url",
                "source_name": url
            }
        elif file_path and file_path.exists():
            # Read file and encode as base64
            with open(file_path, "rb") as f:
                file_content = f.read()
            
            file_base64 = base64.b64encode(file_content).decode('utf-8')
            
            payload = {
                "file_id": file_id,
                "filename": filename,
                "file_type": file_type,
                "file_content": file_base64,
                "source_type": "file",
                "source_name": filename
            }
        else:
            logger.warning("No file or URL provided to n8n")
            return None
        
        # Send to n8n webhook
        logger.info(f"Sending to n8n webhook: {settings.n8n_webhook_url}")
        async with httpx.AsyncClient(timeout=settings.n8n_timeout) as client:
            response = await client.post(
                settings.n8n_webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            # n8n should return the processed data in the response
            n8n_response = response.json()
            
            # Check if n8n returned webhook payload format
            if "data" in n8n_response and isinstance(n8n_response["data"], list):
                # Process the webhook payload
                webhook_payload = N8NWebhookPayload(
                    data=n8n_response["data"],
                    entity_id=n8n_response.get("entity_id", "default-entity"),
                    source_url=url or (f"file://{file_path}" if file_path else None),
                    source_name=n8n_response.get("source_name") or filename or url,
                    observation_date=n8n_response.get("observation_date")
                )
                
                # Process the webhook payload (this will save observations)
                from app.api.webhook import process_n8n_webhook
                result = await process_n8n_webhook(webhook_payload)
                
                return {
                    "status": "processed",
                    "observations_processed": result.success_count,
                    "observations_failed": result.error_count,
                    "observation_ids": result.observation_ids
                }
            else:
                # n8n returned something else, just log it
                logger.info(f"n8n returned non-standard response: {n8n_response}")
                return {
                    "status": "received",
                    "response": n8n_response
                }
                
    except httpx.TimeoutException:
        logger.error(f"n8n webhook timeout after {settings.n8n_timeout}s")
        return {"status": "timeout", "error": "n8n processing timed out"}
    except httpx.HTTPStatusError as e:
        logger.error(f"n8n webhook HTTP error: {e.response.status_code} - {e.response.text}")
        return {"status": "error", "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Error sending to n8n: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


@router.post("/url", response_model=dict, status_code=202)
async def process_url(
    url: str = Form(...),
    entity_id: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    """Process a URL - saves datasource and returns immediately (202 Accepted).
    
    External systems should call /api/v1/datasources/status-update with the source_id
    when processing is complete.
    """
    import uuid
    from app.api.datasources import datasources_db
    from app.models.datasource import DataSource, DataSourceType, DataSourceStatus, UpdateFrequency
    
    # Create datasource immediately
    datasource_id = f"ds-{uuid.uuid4().hex[:12]}"
    datasource_name = name or url
    
    datasource = DataSource(
        id=datasource_id,
        name=datasource_name,
        type=DataSourceType.URL,
        description=description,
        status=DataSourceStatus.PENDING,
        url=url,
        update_frequency=UpdateFrequency.MANUAL,
        auto_extract=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by="system"
    )
    
    datasources_db[datasource_id] = datasource
    logger.info(f"Created datasource {datasource_id} for URL: {url}. Status: PENDING. External system should update status via /datasources/status-update")
    
    # Send POST request to external webhook with source_id (fire-and-forget)
    if settings.n8n_webhook_url:
        async def notify_external_system():
            try:
                payload = {
                    "source_id": datasource_id,
                    "source_type": "url",
                    "url": url,
                    "name": datasource_name,
                    "description": description,
                    "status": "pending",
                    "status_update_url": f"{settings.api_prefix}/datasources/status-update"
                }
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.post(
                        settings.n8n_webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                logger.info(f"Notified external system about datasource {datasource_id}")
            except Exception as e:
                logger.error(f"Error notifying external system about datasource {datasource_id}: {e}", exc_info=True)
                # Don't fail the request if notification fails
        
        import asyncio
        asyncio.create_task(notify_external_system())
    
    # Return 202 Accepted immediately with source_id
    return {
        "status": "accepted",
        "source_id": datasource_id,
        "datasource_id": datasource_id,  # Keep for backward compatibility
        "message": "URL datasource created. Processing will be handled by external system.",
        "url": url
    }
