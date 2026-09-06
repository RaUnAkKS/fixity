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


STOP_WORDS = {
    "the", "a", "an", "is", "in", "at", "on", "of", "to", "for", "with",
    "and", "or", "near", "by", "from", "it", "this", "that", "there", "our",
    "my", "area", "please", "fix", "repair", "very", "facing", "problem", "issue",
}

CIVIC_KEYWORDS = {
    "pothole", "potholes", "street", "road", "streetlight", "light", "lamp",
    "garbage", "trash", "waste", "drain", "drainage", "water", "leak", "leakage",
    "pipe", "pipeline", "manhole", "footpath", "sidewalk", "dog", "dogs",
    "wire", "cable", "pole", "tree", "traffic", "signal", "park", "sewage", "gutter"
}


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def extract_keywords(text: str) -> set[str]:
    """Extract significant lowercase alphanumeric tokens from complaint text."""
    if not text:
        return set()
    import re
    tokens = re.findall(r"\b[a-zA-Z0-9_-]{3,}\b", text.lower())
    return {t for t in tokens if t not in STOP_WORDS}


async def find_duplicate_complaint(
    db: AsyncSession,
    text: str,
    latitude: float,
    longitude: float,
    category: str | None = None,
) -> Complaint | None:
    """
    Search for an active nearby complaint representing the same civic issue.
    
    Rules:
      1. Proximity: within ~150 meters.
      2. Status: active ('submitted', 'analyzing', 'analyzed', 'assigned', 'in_progress').
      3. Topic similarity: overlapping civic keywords & category matching.
      4. Returns the root parent Complaint if duplicate, else None.
    """
    if latitude is None or longitude is None:
        return None

    # Fetch active complaints created in recent times
    query = select(Complaint).where(
        Complaint.status.in_(["submitted", "analyzing", "analyzed", "assigned", "in_progress"]),
        Complaint.latitude.isnot(None),
        Complaint.longitude.isnot(None),
    )
    result = await db.execute(query)
    candidates = result.scalars().all()

    target_tokens = extract_keywords(text)
    norm_category = (category or "").strip().lower()

    for cand in candidates:
        # Distance check
        dist = haversine_distance_meters(latitude, longitude, cand.latitude, cand.longitude)
        if dist > 180.0:
            continue

        # Category compatibility check (distinct category issues at same location remain independent)
        cand_cat = (cand.category or "").strip().lower()
        if norm_category and cand_cat and norm_category != cand_cat:
            continue

        cand_tokens = extract_keywords(cand.original_text or "")
        intersection = target_tokens & cand_tokens
        union = target_tokens | cand_tokens
        jaccard = len(intersection) / max(1, len(union))
        common_civic = intersection & CIVIC_KEYWORDS

        is_dup = False
        # Very close proximity (< 45m) with matching category and at least 1 keyword
        if dist <= 45.0 and (norm_category == cand_cat or len(common_civic) >= 1 or jaccard >= 0.2):
            is_dup = True
        # Neighborhood proximity (< 180m) with strong civic keyword overlap or high jaccard
        elif dist <= 180.0 and (len(common_civic) >= 2 or jaccard >= 0.35):
            is_dup = True

        if is_dup:
            # If candidate is already linked to a parent, resolve to the root parent issue
            if cand.parent_issue_id:
                root_parent = await db.get(Complaint, cand.parent_issue_id)
                if root_parent:
                    return root_parent
            return cand

    return None


async def create_complaint(
    db: AsyncSession, data: ComplaintCreate, citizen_id: UUID
) -> Complaint:
    """Create a new complaint with geocoded address."""
    # Use client-provided address or reverse-geocode
    address = (data.address or "").strip()
    if not address:
        geo = await reverse_geocode(data.latitude, data.longitude)
        address = geo.get("address", "")
    if not address:
        address = f"Ward Location ({round(data.latitude, 4)}, {round(data.longitude, 4)})"

    complaint = Complaint(
        citizen_id=citizen_id,
        original_text=data.original_text,
        latitude=data.latitude,
        longitude=data.longitude,
        address=address,
        detected_language=data.language,
        category=data.category,
        status="submitted",
    )
    # Set PostGIS point via WKT (Well-Known Text)
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
    sort_by: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict:
    """List complaints with filters, sorting, and pagination."""
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

    # Apply sorting
    if sort_by in ("popular", "confirmations", "supports"):
        query = query.order_by(
            Complaint.confirmation_count.desc(),
            Complaint.severity.desc(),
            Complaint.created_at.desc(),
        )
    elif sort_by == "severity":
        query = query.order_by(Complaint.severity.desc(), Complaint.created_at.desc())
    else:
        query = query.order_by(Complaint.created_at.desc())

    query = query.offset(offset).limit(limit)

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
        "submitted": ["analyzing", "analyzed", "assigned", "in_progress", "resolved"],
        "analyzing": ["analyzed", "assigned"],
        "analyzed": ["assigned", "in_progress", "resolved"],
        "assigned": ["in_progress", "resolved"],
        "in_progress": ["resolved", "assigned"],
        "resolved": ["verified", "in_progress"],
        "verified": ["in_progress"],
    }

    allowed = allowed_transitions.get(complaint.status, [])
    if new_status not in allowed:
        raise BadRequestError(
            detail=f"Cannot transition from '{complaint.status}' to '{new_status}'. "
            f"Allowed: {allowed}"
        )

    complaint.status = new_status
    await db.commit()
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
