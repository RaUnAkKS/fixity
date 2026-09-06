"""
Pydantic Models for AI Output Validation
========================================
Validates all raw outputs from LLM calls before handing to services or DB.
"""

from typing import Any, Literal
from pydantic import BaseModel, Field


class ComplaintAnalysisOutput(BaseModel):
    """Output schema for complaint text analysis."""
    detected_language: str
    translated_text: str | None = None
    category: str
    subcategory: str | None = None
    severity: int = Field(ge=1, le=100)
    issues: list[str] = Field(default_factory=list)
    possible_related_issue: str | None = None
    suggested_department: str
    summary: str


class ImageAnalysisOutput(BaseModel):
    """Output schema for photo evidence analysis."""
    detected_issues: list[str] = Field(default_factory=list)
    severity_estimate: int = Field(ge=1, le=100)
    description: str
    confidence: Literal["high", "medium", "low"] = "medium"
    is_relevant: bool = True


class PhotoAutoscanOutput(BaseModel):
    """Output schema for photo auto-scan accessibility feature."""
    description: str
    category: str
    subcategory: str | None = None
    severity: int = Field(ge=1, le=100)
    detected_issues: list[str] = Field(default_factory=list)
    suggested_department: str
    is_relevant: bool = True
    latitude: float | None = None
    longitude: float | None = None
    has_exif_gps: bool = False



class RootCauseItem(BaseModel):
    """Item structure for root cause analysis."""
    cause: str
    confidence: Literal["high", "medium", "low"]
    evidence: str


class RootCauseOutput(BaseModel):
    """Output schema for root cause analysis."""
    possible_causes: list[RootCauseItem] = Field(default_factory=list)
    recommended_intervention: str
    disclaimer: str = "Potential contributing factors, not confirmed engineering assessments"


class VerificationAssessmentOutput(BaseModel):
    """Output schema for citizen verification evaluation."""
    verification_status: Literal["matches", "partial", "mismatch"]
    resolution_score: float = Field(ge=0.0, le=1.0)
    explanation: str


class AudioTranscriptionOutput(BaseModel):
    """Output schema for speech transcription."""
    text: str
    detected_language: str
    confidence: float
