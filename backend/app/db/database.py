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
    """Initialize database - create all tables and run migrations."""
    try:
        logger.info(f"Initializing database at {DB_PATH}")
        Base.metadata.create_all(bind=engine)
        
        # Run migrations to add new columns if they don't exist
        _migrate_add_dimensions_entities()
        
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)
        raise


def _migrate_add_dimensions_entities() -> None:
    """Migration: Add dimensions and entities columns to metric_definitions table if they don't exist."""
    try:
        from sqlalchemy import inspect, text
        
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('metric_definitions')]
        
        with engine.connect() as conn:
            # Add dimensions column if it doesn't exist
            if 'dimensions' not in columns:
                logger.info("Adding 'dimensions' column to metric_definitions table")
                conn.execute(text("ALTER TABLE metric_definitions ADD COLUMN dimensions TEXT"))
                conn.commit()
            
            # Add entities column if it doesn't exist
            if 'entities' not in columns:
                logger.info("Adding 'entities' column to metric_definitions table")
                conn.execute(text("ALTER TABLE metric_definitions ADD COLUMN entities TEXT"))
                conn.commit()
                
    except Exception as e:
        # Table might not exist yet, or column might already exist - that's okay
        logger.debug(f"Migration check completed (this is normal if tables are new): {e}")


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
