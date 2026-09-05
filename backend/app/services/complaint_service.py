import math
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.evidence import ComplaintEvidence
from app.models.user import User
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.schemas.complaint import ComplaintCreate
from app.services.geocoding_service import reverse_geocode


async def create_complaint(
    db: AsyncSession, data: ComplaintCreate, citizen_id: UUID
) -> Complaint:
    """Create a new complaint with geocoded address."""
    # Reverse-geocode to get address
    geo = await reverse_geocode(data.latitude, data.longitude)

    complaint = Complaint(
        citizen_id=citizen_id,
        original_text=data.original_text,
        latitude=data.latitude,
        longitude=data.longitude,
        address=geo.get("address", ""),
        detected_language=data.language,
        category=data.category,
        status="submitted",
    )
    # Set PostGIS point via WKT (Well-Known Text)
    from sqlalchemy import text
    complaint.location = func.ST_SetSRID(
        func.ST_MakePoint(data.longitude, data.latitude), 4326
    )

    db.add(complaint)
    await db.flush()
    await db.refresh(complaint)
    return complaint


async def get_complaint(db: AsyncSession, complaint_id: UUID) -> Complaint:
    """Get a complaint by ID or raise NotFoundError."""
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise NotFoundError(detail="Complaint not found")
    return complaint


async def get_complaint_detail(db: AsyncSession, complaint_id: UUID) -> dict:
    """Get complaint with evidence joined."""
    complaint = await get_complaint(db, complaint_id)

    # Fetch evidence
    evidence_result = await db.execute(
        select(ComplaintEvidence).where(
            ComplaintEvidence.complaint_id == complaint_id
        )
    )
    evidence = evidence_result.scalars().all()

    return {
        "complaint": complaint,
        "evidence": evidence,
    }


async def list_complaints(
    db: AsyncSession,
    *,
    ward_id: int | None = None,
    category: str | None = None,
    status: str | None = None,
    severity_min: int | None = None,
    severity_max: int | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict:
    """List complaints with filters and pagination."""
    query = select(Complaint)
    count_query = select(func.count(Complaint.id))

    # Apply filters
    conditions = []
    if ward_id is not None:
        conditions.append(Complaint.ward_id == ward_id)
    if category is not None:
        conditions.append(Complaint.category == category)
    if status is not None:
        conditions.append(Complaint.status == status)
    if severity_min is not None:
        conditions.append(Complaint.severity >= severity_min)
    if severity_max is not None:
        conditions.append(Complaint.severity <= severity_max)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Pagination
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    query = query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages,
    }


async def list_citizen_complaints(
    db: AsyncSession, citizen_id: UUID, *, status: str | None = None, page: int = 1, limit: int = 20
) -> dict:
    """List complaints for a specific citizen."""
    query = select(Complaint).where(Complaint.citizen_id == citizen_id)
    count_query = select(func.count(Complaint.id)).where(Complaint.citizen_id == citizen_id)

    if status:
        query = query.where(Complaint.status == status)
        count_query = count_query.where(Complaint.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    pages = math.ceil(total / limit) if total > 0 else 1

    offset = (page - 1) * limit
    query = query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {"items": items, "total": total, "page": page, "pages": pages}


async def update_complaint_status(
    db: AsyncSession, complaint_id: UUID, new_status: str
) -> Complaint:
    """Update complaint status (officer action)."""
    complaint = await get_complaint(db, complaint_id)

    # Validate allowed transitions
    allowed_transitions = {
        "submitted": ["analyzing", "assigned"],
        "analyzing": ["analyzed"],
        "analyzed": ["assigned"],
        "assigned": ["in_progress"],
        "in_progress": ["resolved"],
        "resolved": ["verified"],
    }

    allowed = allowed_transitions.get(complaint.status, [])
    if new_status not in allowed:
        raise BadRequestError(
            detail=f"Cannot transition from '{complaint.status}' to '{new_status}'. "
            f"Allowed: {allowed}"
        )

    complaint.status = new_status
    await db.flush()
    await db.refresh(complaint)
    return complaint


async def analyze_complaint_stub(complaint_id: UUID) -> dict:
    """Temporary stub for complaint analysis until Person C integrates.

    Returns mock analysis data so Person B (frontend) can integrate.
    """
    return {
        "id": str(complaint_id),
        "complaint_id": str(complaint_id),
        "detected_language": "hi",
        "translated_text": "The road in our area is very bad",
        "category": "Road Infrastructure",
        "subcategory": "Potholes",
        "severity": 75,
        "issues": ["road damage", "potholes", "water logging"],
        "suggested_department": "Public Works",
        "summary": "Citizen reports poor road conditions with potholes causing water logging",
        "confidence": 0.85,
        "possible_related_issue": "Drainage & Sewage",
    }
