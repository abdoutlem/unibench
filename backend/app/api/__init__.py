from fastapi import APIRouter
from .routes import router as extraction_router
from .glossary import router as glossary_router
from .upload import router as upload_router
from .data import router as data_router
from .webhook import router as webhook_router
from .exploration import router as exploration_router
from .analytics import router as analytics_router
from .reports import router as reports_router
from .metabase import router as metabase_router
from .datasources import router as datasources_router
from .validation import router as validation_router
from .chat import router as chat_router

# Combine all routers
router = APIRouter()
router.include_router(extraction_router)
router.include_router(glossary_router, prefix="/glossary", tags=["glossary"])
router.include_router(upload_router, prefix="/upload", tags=["upload"])
router.include_router(data_router, prefix="/data", tags=["data"])
router.include_router(webhook_router, prefix="/webhook", tags=["webhook"])
router.include_router(exploration_router, prefix="/exploration", tags=["exploration"])
router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
router.include_router(reports_router, prefix="/reports", tags=["reports"])
router.include_router(metabase_router, prefix="/metabase", tags=["metabase"])
router.include_router(datasources_router, prefix="/datasources", tags=["datasources"])
router.include_router(validation_router, prefix="/validation", tags=["validation"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])

__all__ = ["router"]
