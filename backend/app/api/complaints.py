import os
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, get_optional_user, require_role
from app.models.user import User
from app.models.evidence import ComplaintEvidence
from app.models.confirmation import ComplaintConfirmation
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintListResponse,
    ComplaintDetail,
    EvidenceResponse,
    StatusUpdate,
    TimelineResponse,
    ConfirmationResponse,
    CommunityStatusResponse,
)
from app.services import complaint_service
from app.services.reputation_service import ReputationService
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
    """Submit a new civic complaint with duplicate detection and reputation accounting."""
    from sqlalchemy import select
    from app.models.confirmation import ComplaintConfirmation

    # 1. Proximity & Category duplicate detection
    duplicate_parent = await complaint_service.find_duplicate_complaint(
        db,
        text=data.original_text,
        latitude=data.latitude,
        longitude=data.longitude,
        category=data.category,
    )

    complaint = await complaint_service.create_complaint(db, data, current_user.id)

    if duplicate_parent:
        # Duplicate merged into existing active ticket:
        # Link child complaint to parent issue
        complaint.parent_issue_id = duplicate_parent.id
        duplicate_parent.merged_reports_count = (duplicate_parent.merged_reports_count or 0) + 1
        duplicate_parent.confirmation_count = (duplicate_parent.confirmation_count or 0) + 1

        complaint.ai_analysis = {
            "merged_into": str(duplicate_parent.id),
            "is_duplicate": True,
            "notice": f"Linked to ongoing neighborhood civic ticket #{str(duplicate_parent.id)[:8]}",
        }

        # Quality rule: duplicates award +0 report reputation.
        # If reporting citizen is someone else, record confirmation and award standard confirmation points
        if duplicate_parent.citizen_id != current_user.id:
            existing_conf = await db.execute(
                select(ComplaintConfirmation).where(
                    ComplaintConfirmation.complaint_id == duplicate_parent.id,
                    ComplaintConfirmation.user_id == current_user.id,
                )
            )
            if not existing_conf.scalar_one_or_none():
                db.add(ComplaintConfirmation(complaint_id=duplicate_parent.id, user_id=current_user.id))
                # Award +2 confirmation points to reporting citizen
                current_user.civic_reputation = (current_user.civic_reputation or 0) + 2
                current_user.community_confirmations_count = (current_user.community_confirmations_count or 0) + 1

                # Award +2 to parent author if <= 5 confirmations
                parent_author = await db.get(User, duplicate_parent.citizen_id)
                if parent_author and duplicate_parent.confirmation_count <= 5:
                    parent_author.civic_reputation = (parent_author.civic_reputation or 0) + 2
    else:
        # Unique valid complaint: award standard +5 civic reputation
        await ReputationService.award_report_reputation(db, current_user.id)

    await db.commit()
    await db.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)


@router.get("", response_model=ComplaintListResponse)
async def list_complaints(
    ward_id: int | None = Query(None),
    category: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    severity_min: int | None = Query(None),
    severity_max: int | None = Query(None),
    sort_by: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """List complaints with optional filters and sorting."""
    from sqlalchemy import select

    result = await complaint_service.list_complaints(
        db,
        ward_id=ward_id,
        category=category,
        status=status_filter,
        severity_min=severity_min,
        severity_max=severity_max,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )

    confirmed_set = set()
    if current_user and result["items"]:
        item_ids = [c.id for c in result["items"]]
        conf_res = await db.execute(
            select(ComplaintConfirmation.complaint_id).where(
                ComplaintConfirmation.user_id == current_user.id,
                ComplaintConfirmation.complaint_id.in_(item_ids),
            )
        )
        confirmed_set = set(conf_res.scalars().all())

    items_out = []
    for c in result["items"]:
        c_dict = ComplaintResponse.model_validate(c).model_dump()
        c_dict["user_has_confirmed"] = c.id in confirmed_set
        items_out.append(ComplaintResponse(**c_dict))

    return ComplaintListResponse(
        items=items_out,
        total=result["total"],
        page=result["page"],
        pages=result["pages"],
    )


@router.get("/my", response_model=ComplaintListResponse)
async def list_my_complaints(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
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


@router.get("/reverse-geocode")
async def reverse_geocode_location(lat: float = Query(...), lng: float = Query(...)):
    """Reverse-geocode latitude and longitude coordinates into a human-readable address."""
    from app.services.geocoding_service import reverse_geocode
    return await reverse_geocode(lat, lng)


@router.get("/{complaint_id}", response_model=ComplaintDetail)
async def get_complaint(
    complaint_id: UUID,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full complaint detail with community confirmation state."""
    from sqlalchemy import select

    detail = await complaint_service.get_complaint_detail(db, complaint_id)
    complaint = detail["complaint"]

    user_has_confirmed = False
    if current_user:
        conf_res = await db.execute(
            select(ComplaintConfirmation).where(
                ComplaintConfirmation.complaint_id == complaint_id,
                ComplaintConfirmation.user_id == current_user.id,
            )
        )
        user_has_confirmed = conf_res.scalar_one_or_none() is not None

    base_dict = ComplaintResponse.model_validate(complaint).model_dump()
    base_dict["user_has_confirmed"] = user_has_confirmed
    base_dict["is_author"] = bool(current_user and current_user.id == complaint.citizen_id)

    return ComplaintDetail(
        **base_dict,
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI analysis of a complaint.

    Calls analysis_service.analyze_complaint() (Person C implements this).
    Currently returns stub data for frontend integration.
    """
    from app.services.analysis_service import AnalysisService

    # Verify complaint exists
    complaint = await complaint_service.get_complaint(db, complaint_id)

    try:
        service = AnalysisService()
        analysis = await service.analyze_complaint(complaint_id, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI analysis failed: {str(e)}"
        )

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
    if data.status == "resolved":
        await ReputationService.award_resolution_reputation(db, complaint)
        await db.commit()
        await db.refresh(complaint)

    return ComplaintResponse.model_validate(complaint)


@router.get("/{complaint_id}/timeline", response_model=TimelineResponse)
async def get_timeline(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the status timeline for a complaint."""
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


@router.post("/{complaint_id}/verify")
async def verify_complaint(
    complaint_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Citizen verifies resolution of their complaint."""
    complaint = await complaint_service.get_complaint(db, complaint_id)
    
    # Only complaint owner can verify
    if complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only verify your own complaints",
        )
    
    # Must be resolved to verify
    if complaint.status != "resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only resolved complaints can be verified",
        )
    
    # Store verification in ai_analysis JSONB
    from sqlalchemy.orm.attributes import flag_modified
    verification = {
        "rating": data.get("rating"),
        "status": data.get("status"),  # "fixed", "partial", "not_fixed"
        "comment": data.get("comment"),
    }
    
    current_analysis = dict(complaint.ai_analysis or {})
    current_analysis["verification"] = verification
    complaint.ai_analysis = current_analysis
    flag_modified(complaint, "ai_analysis")
    complaint.status = "verified"
    await ReputationService.award_verification_reputation(db, complaint)
    await db.commit()
    await db.refresh(complaint)
    
    return {"status": "verified", "verification": verification}


@router.post("/{complaint_id}/confirm", response_model=ConfirmationResponse)
async def confirm_complaint(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Community confirmation ('I am affected too').
    Increments community signal, awards citizen civic reputation, and highlights critical issues for officers.
    """
    return await ReputationService.confirm_complaint(db, complaint_id, current_user.id)


@router.get("/{complaint_id}/community", response_model=CommunityStatusResponse)
async def get_community_status(
    complaint_id: UUID,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get community signal metrics and confirmation state for a complaint."""
    return await ReputationService.get_community_status(
        db, complaint_id, current_user.id if current_user else None
    )


@router.post("/scan-photo")
async def scan_photo(
    file: UploadFile = File(...),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Scan an uploaded civic photo with AI multimodal vision.
    Auto-detects problem description, category, subcategory, severity,
    and extracts EXIF GPS coordinates for instant accessible reporting.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_PHOTO_TYPES:
        raise BadRequestError(
            detail=f"File type '{content_type}' not allowed for photo scan. Allowed: JPEG, PNG, WebP"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise BadRequestError(
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
        )

    from app.services.image_service import ImageService
    service = ImageService()
    try:
        analysis = await service.scan_photo(content, content_type)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo scan failed: {str(e)}",
        )

