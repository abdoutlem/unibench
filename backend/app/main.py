"""FastAPI application entry point."""

import os
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import router
from app.db.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Reduce SQLAlchemy engine logging verbosity (only show warnings/errors, not every query)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix=settings.api_prefix)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting UniBench Extraction API...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)

    # Sync glossary YAML → metric_definitions, then seed observations
    try:
        from app.db.database import get_db_session
        from seed_database import sync_glossary_to_db, seed_database
        db = get_db_session()
        try:
            sync_glossary_to_db(db)
            seed_database(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to seed database: {e}", exc_info=True)
    
    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory: {upload_dir.absolute()}")
    
    # Log extraction method availability
    logger.info(f"Extraction methods available:")
    logger.info(f"  - RULE_BASED: Always available")
    logger.info(f"  - AI: {'Available' if (settings.anthropic_api_key or settings.openai_api_key) else 'Not configured (using mock)'}")
    logger.info(f"  - HYBRID: Available")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
