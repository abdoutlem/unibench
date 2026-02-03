"""Metabase embedding API endpoints."""

import logging
import time
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/embed-token")
async def get_embed_token(
    dashboard_id: Optional[int] = Query(None, description="Dashboard ID to embed (defaults to configured dashboard)")
):
    """
    Generate a JWT token for embedding a Metabase dashboard.
    
    The token expires in 10 minutes for security.
    """
    try:
        # Use provided dashboard_id or fall back to configured default
        target_dashboard_id = dashboard_id or settings.metabase_dashboard_id
        
        if not target_dashboard_id:
            raise HTTPException(
                status_code=400,
                detail="Dashboard ID not provided and no default dashboard configured. "
                       "Provide dashboard_id query parameter or set METABASE_DASHBOARD_ID in environment."
            )
        
        if not settings.metabase_secret_key:
            raise HTTPException(
                status_code=500,
                detail="Metabase secret key not configured. Set METABASE_SECRET_KEY in environment."
            )
        
        # Create JWT payload
        payload = {
            "resource": {"dashboard": target_dashboard_id},
            "params": {},
            "exp": round(time.time()) + (60 * 10),  # 10 minute expiration
            "_embedding_params": {}
        }
        
        # Generate token
        token = jwt.encode(payload, settings.metabase_secret_key, algorithm="HS256")
        
        logger.info(f"Generated Metabase embed token for dashboard {target_dashboard_id}")
        
        return {
            "token": token,
            "dashboard_id": target_dashboard_id,
            "expires_in": 600,  # 10 minutes in seconds
            "instance_url": settings.metabase_instance_url or "http://localhost:3001"
        }
        
    except jwt.PyJWTError as e:
        logger.error(f"Error generating JWT token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error generating embed token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
