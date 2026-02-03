"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional, Union
import json


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra environment variables (like NEXT_PUBLIC_* for frontend)
    )

    # API
    api_title: str = "UniBench Extraction API"
    api_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    debug: bool = True

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, list]) -> list[str]:
        """Parse CORS origins from env variable (supports JSON array or comma-separated string)."""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # Try JSON first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            # Fall back to comma-separated
            if "," in v:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
            # Single value
            return [v.strip()] if v.strip() else []
        return v

    # AI Configuration
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    default_ai_provider: str = "openai"  # Use OpenAI/GPT by default
    default_ai_model: str = "gpt-4-turbo-preview"  # Use GPT-4 Turbo by default

    # Storage
    upload_dir: str = "./uploads"
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    
    # Database
    database_url: Optional[str] = None  # If None, uses default SQLite path
    database_echo: bool = False  # Echo SQL queries
    
    # n8n Integration
    n8n_webhook_url: Optional[str] = None  # n8n webhook URL for sending documents/URLs
    n8n_timeout: int = 300  # Timeout in seconds for n8n processing (5 minutes default)
    
    # Metabase Integration
    metabase_instance_url: Optional[str] = None  # Metabase instance URL (e.g., http://localhost:3001)
    metabase_secret_key: Optional[str] = None  # Metabase embedding secret key
    metabase_dashboard_id: Optional[int] = None  # Default dashboard ID to embed


settings = Settings()
