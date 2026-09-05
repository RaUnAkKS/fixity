"""
Pydantic Schemas for Complaint Analysis API
===========================================
Defines the schema for analysis requests and responses in the API layer.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class ComplaintAnalysisResponse(BaseModel):
    """Schema for POST /api/complaints/{id}/analyze response."""
    id: UUID | None = None
    complaint_id: UUID
    detected_language: str
    translated_text: str | None = None
    category: str
    subcategory: str | None = None
    severity: int = Field(ge=1, le=100)
    issues: list[str] = Field(default_factory=list)
    possible_related_issue: str | None = None
    suggested_department: str
    summary: str
    confidence: float = 0.85
    analyzed_at: datetime | None = None

    class Config:
        from_attributes = True
