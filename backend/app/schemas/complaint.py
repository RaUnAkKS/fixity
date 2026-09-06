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
    address: str | None = None


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
    """Standard complaint response with community signal metrics."""

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
    parent_issue_id: UUID | None = None
    merged_reports_count: int = 0
    reporter_reputation: int = 0
    reporter_name: str | None = None
    confirmation_count: int = 0
    community_signal: str = "Low"
    community_signal_score: int = 1
    user_has_confirmed: bool = False
    is_community_critical: bool = False
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
    is_author: bool = False


class ConfirmationResponse(BaseModel):
    """Response returned when a user confirms an issue ('I'm affected too')."""

    confirmed: bool = True
    confirmation_count: int
    community_signal: str
    community_signal_score: int
    is_community_critical: bool
    user_has_confirmed: bool = True


class CommunityStatusResponse(BaseModel):
    """Community signal status for an issue."""

    complaint_id: UUID
    confirmation_count: int
    community_signal: str
    community_signal_score: int
    is_community_critical: bool
    user_has_confirmed: bool
    is_author: bool



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
