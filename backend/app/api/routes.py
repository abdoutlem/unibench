"""API routes for extraction service."""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import uuid

from app.models import (
    ExtractionRule,
    ExtractionTemplate,
    ExtractionJob,
    ExtractionResult,
    ExtractionMethod,
    SemanticMapping,
    ExtractionPattern,
    PatternType,
    AIConfig,
    ResultStatus,
)
from app.services import ExtractionService
from app.core.config import settings
from app.api.mock_data import (
    MOCK_RULES,
    MOCK_TEMPLATES,
    MOCK_JOBS,
    MOCK_RESULTS,
)
from app.services.glossary_loader import get_glossary_loader

router = APIRouter()

# In-memory storage for Phase 0
rules_db: dict[str, ExtractionRule] = {r.id: r for r in MOCK_RULES}
templates_db: dict[str, ExtractionTemplate] = {t.id: t for t in MOCK_TEMPLATES}
jobs_db: dict[str, ExtractionJob] = {j.id: j for j in MOCK_JOBS}

# Use real AI if API keys are configured, otherwise fall back to mock
extraction_service = ExtractionService(use_mock_ai=False)
glossary_loader = get_glossary_loader()


def _ensure_glossary_rules() -> None:
    """
    Ensure every active glossary metric is represented as an ExtractionRule in rules_db.
    This makes the frontend "Select Extraction Rules" list show the full glossary.
    """
    try:
        glossary_loader.load_all()
        metrics = [m for m in glossary_loader.get_all_metrics() if getattr(m, "is_active", True)]
        for m in metrics:
            rid = f"rule-glossary-{m.id}"
            if rid in rules_db:
                continue
            rules_db[rid] = ExtractionRule(
                id=rid,
                name=m.name,
                description=m.description,
                target_metric_id=m.id,
                target_metric_name=m.canonical_name or m.name,
                is_active=True,
                extraction_method=ExtractionMethod.HYBRID,
                patterns=[],
                semantic_mappings=[],
                validation_rules=[],
                unit=m.unit or "",
            )
    except Exception:
        # Don't break the API if glossary loading fails; caller will surface errors elsewhere.
        return


# ============ Rules API ============

@router.get("/rules", response_model=list[ExtractionRule])
async def list_rules():
    """List all extraction rules."""
    _ensure_glossary_rules()
    return list(rules_db.values())


@router.get("/rules/{rule_id}", response_model=ExtractionRule)
async def get_rule(rule_id: str):
    """Get a specific extraction rule."""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rules_db[rule_id]


@router.post("/rules", response_model=ExtractionRule)
async def create_rule(rule: ExtractionRule):
    """Create a new extraction rule."""
    if not rule.id:
        rule.id = f"rule-{uuid.uuid4().hex[:8]}"
    rules_db[rule.id] = rule
    return rule


@router.put("/rules/{rule_id}", response_model=ExtractionRule)
async def update_rule(rule_id: str, rule: ExtractionRule):
    """Update an extraction rule."""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.id = rule_id
    rules_db[rule_id] = rule
    return rule


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    """Delete an extraction rule."""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")
    del rules_db[rule_id]
    return {"status": "deleted"}


# ============ Semantic Mappings API ============

@router.post("/rules/{rule_id}/mappings", response_model=ExtractionRule)
async def add_semantic_mapping(rule_id: str, mapping: SemanticMapping):
    """Add a semantic mapping to a rule."""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule = rules_db[rule_id]
    if not mapping.id:
        mapping.id = f"sem-{uuid.uuid4().hex[:8]}"
    rule.semantic_mappings.append(mapping)
    return rule


@router.delete("/rules/{rule_id}/mappings/{mapping_id}")
async def remove_semantic_mapping(rule_id: str, mapping_id: str):
    """Remove a semantic mapping from a rule."""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule = rules_db[rule_id]
    rule.semantic_mappings = [m for m in rule.semantic_mappings if m.id != mapping_id]
    return {"status": "deleted"}


# ============ Templates API ============

@router.get("/templates", response_model=list[ExtractionTemplate])
async def list_templates():
    """List all extraction templates."""
    return list(templates_db.values())


@router.get("/templates/{template_id}", response_model=ExtractionTemplate)
async def get_template(template_id: str):
    """Get a specific template."""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    return templates_db[template_id]


@router.post("/templates", response_model=ExtractionTemplate)
async def create_template(template: ExtractionTemplate):
    """Create a new extraction template."""
    if not template.id:
        template.id = f"tmpl-{uuid.uuid4().hex[:8]}"
    templates_db[template.id] = template
    return template


# ============ Extraction Jobs API ============

@router.get("/jobs", response_model=list[ExtractionJob])
async def list_jobs():
    """List all extraction jobs."""
    return list(jobs_db.values())


@router.get("/jobs/{job_id}", response_model=ExtractionJob)
async def get_job(job_id: str):
    """Get a specific job with results."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_db[job_id]


@router.post("/jobs", response_model=ExtractionJob)
async def create_job(
    document_ids: list[str],
    rule_ids: list[str],
    method: ExtractionMethod = ExtractionMethod.HYBRID,
    template_id: Optional[str] = None
):
    """Create a new extraction job."""
    rules = [rules_db[rid] for rid in rule_ids if rid in rules_db]
    if not rules:
        raise HTTPException(status_code=400, detail="No valid rules provided")

    job = extraction_service.create_job(
        document_ids=document_ids,
        rules=rules,
        method=method,
        template_id=template_id
    )
    jobs_db[job.id] = job
    return job


@router.post("/jobs/{job_id}/run", response_model=ExtractionJob)
async def run_job(job_id: str):
    """Run an extraction job (mock for Phase 0)."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_db[job_id]

    # For Phase 0, return mock results
    job.status = "completed"
    job.progress = 100.0
    job.results = MOCK_RESULTS

    return job


# ============ Quick Extract API ============

@router.post("/extract")
async def extract_from_file(
    rule_ids: str = Form(...),  # Comma-separated
    method: str = Form("hybrid"),  # Accept as string, convert to enum
    file: Optional[UploadFile] = File(None),  # Optional: direct file upload
    file_id: Optional[str] = Form(None),  # Optional: use uploaded file ID instead
    preview_only: bool = Form(False)  # If True, don't save to fact table, just return results
):
    """Quick extraction from uploaded file.
    
    Either 'file' or 'file_id' must be provided.
    - If 'file_id' is provided, the file will be loaded from storage
    - If 'file' is provided, it will be used directly
    """
    import logging
    from pathlib import Path
    logger = logging.getLogger(__name__)

    # Ensure glossary-derived rules exist (so rule_ids can reference them)
    _ensure_glossary_rules()
    
    # Convert method string to enum
    try:
        method_enum = ExtractionMethod(method.lower())
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid method '{method}'. Must be one of: {[e.value for e in ExtractionMethod]}"
        )
    
    logger.info(f"Extraction request: file={file.filename if file else 'None'}, file_id={file_id}, method={method_enum.value}, rules={rule_ids}")
    
    # Validate that either file or file_id is provided
    has_file = file is not None and (file.filename is not None if file else False)
    if not file_id and not has_file:
        logger.error("Neither file nor file_id provided")
        raise HTTPException(
            status_code=422,
            detail="Either 'file' or 'file_id' must be provided"
        )
    
    if file_id and has_file:
        logger.warning("Both file and file_id provided, using file_id")
    
    # If file_id is provided, use uploaded file
    if file_id:
        from app.api.upload import uploaded_files_db
        if file_id not in uploaded_files_db:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_metadata = uploaded_files_db[file_id]
        file_path = Path(file_metadata["upload_path"])
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        with open(file_path, "rb") as f:
            content = f.read()
        filename = file_metadata["filename"]
    else:
        # Validate file size
        content = await file.read()
        if len(content) > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {settings.max_upload_size / (1024 * 1024):.1f}MB"
            )

        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        filename = file.filename
    
    file_ext = filename.split('.')[-1].lower() if '.' in filename else ''
    supported_extensions = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'csv', 'txt']
    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported types: {', '.join(supported_extensions)}"
        )

    rule_id_list = [r.strip() for r in rule_ids.split(",")]
    rules = [rules_db[rid] for rid in rule_id_list if rid in rules_db]

    if not rules:
        raise HTTPException(status_code=400, detail="No valid rules provided")

    logger.info(f"Processing extraction with {len(rules)} rules using {method_enum.value} method")

    # Create and run job
    document_id = file_id or "upload"
    job = extraction_service.create_job(
        document_ids=[document_id],
        rules=rules,
        method=method_enum
    )

    results = extraction_service.process_document(
        file_path=filename,
        file_content=content,
        rules=rules,
        method=method_enum,
        document_id=document_id,
        job_id=job.id,
        preview_only=preview_only
    )

    job.results = results
    job.status = "completed"
    job.progress = 100.0
    
    logger.info(f"Extraction completed: {len(results)} results")

    return job


@router.post("/extract/preview")
async def preview_extracted_text(
    file: UploadFile = File(...)
):
    """Preview extracted text from a file before applying extraction rules."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Preview request: file={file.filename}")
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size of {settings.max_upload_size / (1024 * 1024):.1f}MB"
        )

    # Parse document to get extracted text
    parser = extraction_service.parser
    doc = parser.parse(file.filename or "upload", content)
    
    return {
        "filename": doc.filename,
        "file_type": doc.file_type,
        "text_preview": doc.text[:5000],  # First 5000 characters
        "full_text_length": len(doc.text),
        "page_count": len(doc.pages),
        "table_count": len(doc.tables),
        "metadata": doc.metadata,
        "pages": doc.pages[:3] if len(doc.pages) > 3 else doc.pages,  # First 3 pages
        "tables": doc.tables[:5] if len(doc.tables) > 5 else doc.tables  # First 5 tables
    }


# ============ Results API ============

@router.get("/results", response_model=list[ExtractionResult])
async def list_results(
    job_id: Optional[str] = None,
    status: Optional[ResultStatus] = None
):
    """List extraction results with optional filters."""
    results = []
    for job in jobs_db.values():
        for result in job.results:
            if job_id and result.job_id != job_id:
                continue
            if status and result.status != status:
                continue
            results.append(result)
    return results


@router.put("/results/{result_id}/review")
async def review_result(
    result_id: str,
    status: ResultStatus,
    notes: Optional[str] = None,
    modified_value: Optional[float] = None
):
    """Review and approve/reject an extraction result."""
    # Find the result
    for job in jobs_db.values():
        for result in job.results:
            if result.id == result_id:
                result.status = status
                if notes:
                    result.notes = notes
                if modified_value is not None:
                    result.normalized_value = modified_value
                return result

    raise HTTPException(status_code=404, detail="Result not found")


# ============ AI Configuration API ============

@router.get("/ai/config", response_model=AIConfig)
async def get_ai_config():
    """Get current AI configuration."""
    return extraction_service.ai_config


@router.put("/ai/config", response_model=AIConfig)
async def update_ai_config(config: AIConfig):
    """Update AI configuration."""
    extraction_service.ai_config = config
    return config
