"""Database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from pathlib import Path
from typing import Generator
import logging

from app.core.config import settings
from app.db.models import Base

logger = logging.getLogger(__name__)

# Database path
DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "unibench.db"

# Create engine with SQLite-specific settings
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},  # Needed for SQLite
    poolclass=StaticPool,  # SQLite doesn't support connection pooling well
    echo=settings.database_echo,  # Log SQL queries if enabled
)

# Reduce SQLAlchemy engine logging verbosity
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)  # Only show warnings/errors

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database - create all tables."""
    try:
        logger.info(f"Initializing database at {DB_PATH}")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)
        raise


def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """Get a database session (for use outside FastAPI dependency injection)."""
    return SessionLocal()
