"""Chat API endpoint for natural-language analytics queries."""

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.chat_service import execute_chat_query

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessage(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_history: List[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    explore_request: Optional[Dict[str, Any]] = None
    explore_result: Optional[Dict[str, Any]] = None
    suggested_chart_type: Optional[str] = None
    confidence: float = 0.0


@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatRequest, db: Session = Depends(get_db)):
    """Process a natural-language analytics question."""
    try:
        history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
        result = await execute_chat_query(request.message, history, db)
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Chat query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
