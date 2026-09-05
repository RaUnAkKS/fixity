import os
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.evidence import ComplaintEvidence
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintListResponse,
    ComplaintDetail,
    EvidenceResponse,
    StatusUpdate,
    TimelineResponse,
)
from app.services import complaint_service
from app.config import get_settings
from app.core.exceptions import BadRequestError

settings = get_settings()

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

# Allowed MIME types for evidence upload
ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/mp3", "audio/mpeg", "audio/webm", "audio/ogg"}
ALLOWED_DOC_TYPES = {"application/pdf"}
ALL_ALLOWED_TYPES = ALLOWED_PHOTO_TYPES | ALLOWED_AUDIO_TYPES | ALLOWED_DOC_TYPES

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # bytes


@router.post("", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a new civic complaint (citizen)."""
    complaint = await complaint_service.create_complaint(db, data, current_user.id)
    return ComplaintResponse.model_validate(complaint)


@router.get("", response_model=ComplaintListResponse)
async def list_complaints(
    ward_id: int | None = Query(None),
    category: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    severity_min: int | None = Query(None),
    severity_max: int | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all complaints with filters (officer/admin)."""
    result = await complaint_service.list_complaints(
        db,
        ward_id=ward_id,
        category=category,
        status=status_filter,
        severity_min=severity_min,
        severity_max=severity_max,
        page=page,
        limit=limit,
    )
    return ComplaintListResponse(
        items=[ComplaintResponse.model_validate(c) for c in result["items"]],
        total=result["total"],
        page=result["page"],
        pages=result["pages"],
    )


@router.get("/my", response_model=ComplaintListResponse)
async def list_my_complaints(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the authenticated citizen's own complaints."""
    result = await complaint_service.list_citizen_complaints(
        db, current_user.id, status=status_filter, page=page, limit=limit
    )
    return ComplaintListResponse(
        items=[ComplaintResponse.model_validate(c) for c in result["items"]],
        total=result["total"],
        page=result["page"],
        pages=result["pages"],
    )


@router.get("/{complaint_id}", response_model=ComplaintDetail)
async def get_complaint(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full complaint detail (citizen sees own, officer sees all)."""
    detail = await complaint_service.get_complaint_detail(db, complaint_id)
    complaint = detail["complaint"]

    # Citizens can only see their own complaints
    if current_user.role == "citizen" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own complaints",
        )

    return ComplaintDetail(
        **ComplaintResponse.model_validate(complaint).model_dump(),
        evidence=[EvidenceResponse.model_validate(e) for e in detail["evidence"]],
        analysis=complaint.ai_analysis,
        cluster=None,
        verifications=[],
    )


@router.post("/{complaint_id}/evidence", response_model=EvidenceResponse, status_code=201)
async def upload_evidence(
    complaint_id: UUID,
    file: UploadFile = File(...),
    evidence_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload evidence (photo/audio/document) for a complaint."""
    # Validate complaint exists and belongs to citizen
    complaint = await complaint_service.get_complaint(db, complaint_id)
    if complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add evidence to your own complaints",
        )

    # Validate evidence_type
    if evidence_type not in ("photo", "audio", "document"):
        raise BadRequestError(detail="evidence_type must be 'photo', 'audio', or 'document'")

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ALL_ALLOWED_TYPES:
        raise BadRequestError(
            detail=f"File type '{content_type}' not allowed. "
            f"Allowed: JPEG, PNG, WebP, WAV, MP3, WebM, OGG, PDF"
        )

    # Validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise BadRequestError(
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
        )

    # Determine subdirectory
    subdir = "photos" if evidence_type == "photo" else "audio" if evidence_type == "audio" else "photos"

    # Save file
    file_ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, subdir, filename)

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{subdir}/{filename}"

    # Create evidence record
    evidence = ComplaintEvidence(
        complaint_id=complaint_id,
        evidence_type=evidence_type,
        file_path=file_path,
        file_url=file_url,
        mime_type=content_type,
    )
    db.add(evidence)
    await db.flush()
    await db.refresh(evidence)

    return EvidenceResponse.model_validate(evidence)


@router.post("/{complaint_id}/analyze")
async def analyze_complaint(
    complaint_id: UUID,
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI analysis of a complaint.

    Calls analysis_service.analyze_complaint() (Person C implements this).
    Currently returns stub data for frontend integration.
    """
    # Verify complaint exists
    complaint = await complaint_service.get_complaint(db, complaint_id)

    # Use stub until Person C integrates
    analysis = await complaint_service.analyze_complaint_stub(complaint_id)

    # Update complaint with analysis results
    complaint.status = "analyzed"
    complaint.category = analysis.get("category", complaint.category)
    complaint.severity = analysis.get("severity", complaint.severity)
    complaint.translated_text = analysis.get("translated_text", complaint.translated_text)
    complaint.detected_language = analysis.get("detected_language", complaint.detected_language)
    complaint.ai_description = analysis.get("summary", complaint.ai_description)
    complaint.ai_analysis = analysis
    await db.flush()

    return analysis


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_status(
    complaint_id: UUID,
    data: StatusUpdate,
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update complaint status (officer action)."""
    complaint = await complaint_service.update_complaint_status(
        db, complaint_id, data.status
    )
    return ComplaintResponse.model_validate(complaint)


@router.get("/{complaint_id}/timeline", response_model=TimelineResponse)
async def get_timeline(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the status timeline for a complaint.

    TODO: Pull events from audit_log once it's set up.
    For now, returns the current status as a single event.
    """
    complaint = await complaint_service.get_complaint(db, complaint_id)

    # Citizens can only see their own
    if current_user.role == "citizen" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own complaint timelines",
        )

    events = [
        {
            "status": "submitted",
            "timestamp": complaint.created_at,
            "description": "Complaint submitted by citizen",
            "actor": None,
        }
    ]

    if complaint.status != "submitted":
        events.append(
            {
                "status": complaint.status,
                "timestamp": complaint.updated_at,
                "description": f"Status changed to {complaint.status}",
                "actor": None,
            }
        )

    return TimelineResponse(events=events)
