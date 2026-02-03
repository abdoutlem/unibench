"""Saved reports CRUD API endpoints."""

import logging
import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import SavedReport
from app.models.reports import (
    CreateReportRequest, UpdateReportRequest, SavedReportResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=SavedReportResponse)
async def create_report(request: CreateReportRequest, db: Session = Depends(get_db)):
    """Create a new saved report."""
    try:
        now = datetime.utcnow()
        report = SavedReport(
            report_id=str(uuid.uuid4()),
            title=request.title,
            description=request.description,
            tags=request.tags,
            query_config=request.query_config,
            chart_type=request.chart_type,
            chart_config=request.chart_config,
            created_at=now,
            updated_at=now,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return _to_response(report)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[SavedReportResponse])
async def list_reports(
    search: Optional[str] = Query(None, description="Search in title, description, tags"),
    db: Session = Depends(get_db),
):
    """List all saved reports with optional search."""
    try:
        query = db.query(SavedReport).order_by(SavedReport.updated_at.desc())

        if search:
            like = f"%{search}%"
            query = query.filter(
                SavedReport.title.ilike(like) | SavedReport.description.ilike(like)
            )

        reports = query.all()
        return [_to_response(r) for r in reports]
    except Exception as e:
        logger.error(f"Error listing reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}", response_model=SavedReportResponse)
async def get_report(report_id: str, db: Session = Depends(get_db)):
    """Get a single saved report."""
    report = db.query(SavedReport).filter(SavedReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_response(report)


@router.put("/{report_id}", response_model=SavedReportResponse)
async def update_report(
    report_id: str, request: UpdateReportRequest, db: Session = Depends(get_db)
):
    """Update report metadata."""
    try:
        report = db.query(SavedReport).filter(SavedReport.report_id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        if request.title is not None:
            report.title = request.title
        if request.description is not None:
            report.description = request.description
        if request.tags is not None:
            report.tags = request.tags
        if request.query_config is not None:
            report.query_config = request.query_config
        if request.chart_type is not None:
            report.chart_type = request.chart_type
        if request.chart_config is not None:
            report.chart_config = request.chart_config

        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return _to_response(report)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}")
async def delete_report(report_id: str, db: Session = Depends(get_db)):
    """Delete a saved report."""
    try:
        report = db.query(SavedReport).filter(SavedReport.report_id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        db.delete(report)
        db.commit()
        return {"status": "deleted", "report_id": report_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _to_response(report: SavedReport) -> SavedReportResponse:
    return SavedReportResponse(
        report_id=report.report_id,
        title=report.title,
        description=report.description,
        tags=report.tags or [],
        query_config=report.query_config,
        chart_type=report.chart_type,
        chart_config=report.chart_config or {},
        created_at=report.created_at,
        updated_at=report.updated_at,
        created_by=report.created_by,
    )
