from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import require_role
from app.models.user import User
from app.models.complaint import Complaint

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard summary stats for officers."""
    # Total complaints
    total_result = await db.execute(select(func.count(Complaint.id)))
    total_complaints = total_result.scalar() or 0

    # Active complaints (not resolved or verified)
    active_result = await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.status.notin_(["resolved", "verified"])
        )
    )
    active_complaints = active_result.scalar() or 0

    # High priority areas (severity >= 70)
    high_priority_result = await db.execute(
        select(func.count(func.distinct(Complaint.ward_id))).where(
            Complaint.severity >= 70
        )
    )
    high_priority_areas = high_priority_result.scalar() or 0

    # Pending verifications (resolved but not verified)
    pending_result = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.status == "resolved")
    )
    pending_verifications = pending_result.scalar() or 0

    # Resolved this month
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    resolved_result = await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.status.in_(["resolved", "verified"]),
            Complaint.updated_at >= month_start,
        )
    )
    resolved_this_month = resolved_result.scalar() or 0

    return {
        "total_complaints": total_complaints,
        "active_complaints": active_complaints,
        "high_priority_areas": high_priority_areas,
        "pending_verifications": pending_verifications,
        "active_projects": 0,  # Populated once projects model exists
        "resolved_this_month": resolved_this_month,
        "avg_resolution_score": 0.0,  # Populated once impact measurement exists
    }


@router.get("/trends")
async def dashboard_trends(
    days: int = 30,
    current_user: User = Depends(require_role("officer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get complaint trends over the last N days."""
    from datetime import datetime, timedelta, timezone

    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Daily complaint counts
    daily_result = await db.execute(
        select(
            func.date_trunc("day", Complaint.created_at).label("date"),
            func.count(Complaint.id).label("count"),
            func.avg(Complaint.severity).label("avg_severity"),
        )
        .where(Complaint.created_at >= start_date)
        .group_by(func.date_trunc("day", Complaint.created_at))
        .order_by(func.date_trunc("day", Complaint.created_at))
    )
    daily = [
        {
            "date": row.date.isoformat() if row.date else None,
            "count": row.count,
            "avg_severity": round(row.avg_severity, 1) if row.avg_severity else 0,
        }
        for row in daily_result.all()
    ]

    # By category breakdown
    category_result = await db.execute(
        select(
            Complaint.category,
            func.count(Complaint.id).label("count"),
        )
        .where(Complaint.created_at >= start_date, Complaint.category.isnot(None))
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
    )
    by_category = [
        {"category": row.category, "count": row.count}
        for row in category_result.all()
    ]

    return {"daily": daily, "by_category": by_category}
