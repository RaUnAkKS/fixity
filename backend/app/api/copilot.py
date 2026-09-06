"""
CivicAI Government AI Copilot API Router
========================================
Endpoints for conversational municipal intelligence, daily executive briefings,
and context-aware query suggestions.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role, get_db
from app.models.user import User
from app.schemas.copilot import (
    CopilotBriefingResponse,
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotSuggestionItem,
)
from app.services.copilot_service import CopilotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/copilot", tags=["Government AI Copilot"])
copilot_service = CopilotService()


@router.post(
    "/chat",
    response_model=CopilotChatResponse,
    summary="Chat with Government AI Copilot",
    description="Ask natural language questions about civic priorities, root causes, budget ROI, and spatial clusters.",
)
async def chat_with_copilot(
    request: CopilotChatRequest,
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Conversational intelligence endpoint for municipal officers and administrators."""
    try:
        response = await copilot_service.process_chat(request=request, db=db)
        return response
    except Exception as e:
        logger.error("Error processing copilot chat: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process copilot query: {str(e)}",
        )


@router.get(
    "/briefing",
    response_model=CopilotBriefingResponse,
    summary="Get Executive Morning Briefing",
    description="Retrieve an instant operational intelligence summary of top hotspots, backlogs, and citizen satisfaction.",
)
async def get_executive_briefing(
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Executive morning briefing for city commissioners and ward officers."""
    try:
        briefing = await copilot_service.generate_briefing(db=db)
        return briefing
    except Exception as e:
        logger.error("Error generating executive briefing: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate executive briefing",
        )


@router.get(
    "/suggestions",
    response_model=List[CopilotSuggestionItem],
    summary="Get Contextual Query Suggestions",
    description="Retrieve prompt suggestions for common municipal decision workflows.",
)
async def get_copilot_suggestions(
    current_user: User = Depends(require_role("officer", "admin")),
):
    """Curated suggestions for municipal officers."""
    return copilot_service.get_suggestions()
