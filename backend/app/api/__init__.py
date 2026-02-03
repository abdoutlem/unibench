from fastapi import APIRouter
from .routes import router as extraction_router
from .glossary import router as glossary_router
from .upload import router as upload_router
from .data import router as data_router
from .webhook import router as webhook_router
from .exploration import router as exploration_router

# Combine all routers
router = APIRouter()
router.include_router(extraction_router)
router.include_router(glossary_router, prefix="/glossary", tags=["glossary"])
router.include_router(upload_router, prefix="/upload", tags=["upload"])
router.include_router(data_router, prefix="/data", tags=["data"])
router.include_router(webhook_router, prefix="/webhook", tags=["webhook"])
router.include_router(exploration_router, prefix="/exploration", tags=["exploration"])

__all__ = ["router"]
