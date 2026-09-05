from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


# ── Create ──


class ComplaintCreate(BaseModel):
    """Schema for submitting a new complaint."""

    original_text: str = Field(..., min_length=1)
    latitude: float
    longitude: float
    language: str | None = None
    category: str | None = None


# ── Evidence ──


class EvidenceResponse(BaseModel):
    """Evidence file attached to a complaint."""

    id: UUID
    complaint_id: UUID
    evidence_type: str
    file_url: str | None = None
    mime_type: str | None = None
    ai_analysis: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Responses ──


class ComplaintResponse(BaseModel):
    """Standard complaint response."""

    id: UUID
    citizen_id: UUID
    original_text: str
    translated_text: str | None = None
    detected_language: str | None = None
    category: str | None = None
    subcategory: str | None = None
    ai_description: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None
    ward_id: int | None = None
    severity: int | None = None
    status: str
    department_id: int | None = None
    cluster_id: UUID | None = None
    ai_analysis: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    """Paginated list of complaints."""

    items: list[ComplaintResponse]
    total: int
    page: int
    pages: int


class ComplaintDetail(ComplaintResponse):
    """Full complaint detail with related objects."""

    evidence: list[EvidenceResponse] = []
    analysis: dict | None = None
    cluster: dict | None = None  # ClusterSummary, filled when available
    verifications: list[dict] = []  # VerificationResponse, filled when available


# ── Status Update ──


class StatusUpdate(BaseModel):
    """Schema for updating complaint status (officer action)."""

    status: str = Field(
        ...,
        pattern="^(assigned|in_progress|resolved)$",
        description="One of: assigned, in_progress, resolved",
    )


# ── Timeline ──


class TimelineEvent(BaseModel):
    """A single status change event in the complaint timeline."""

    status: str
    timestamp: datetime
    description: str
    actor: str | None = None


class TimelineResponse(BaseModel):
    """Full complaint timeline."""

    events: list[TimelineEvent]
