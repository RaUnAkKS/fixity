from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_optional_user
from app.models.user import User
from app.models.complaint import Complaint

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


import time
from typing import Any

# Simple in-memory cache for dashboard summary (5-second TTL)
_summary_cache: dict[str, Any] = {"data": None, "timestamp": 0}


@router.get("/summary")
async def dashboard_summary(
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard summary stats with single-query aggregation and low-latency caching."""
    now_ts = time.time()
    if _summary_cache["data"] and (now_ts - _summary_cache["timestamp"] < 5):
        return _summary_cache["data"]

    from datetime import datetime, timezone
    from sqlalchemy import case

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Combined single query replacing 5 separate roundtrips
    query = select(
        func.count(Complaint.id).label("total_complaints"),
        func.count(
            case(
                (Complaint.status.notin_(["resolved", "verified"]), Complaint.id),
            )
        ).label("active_complaints"),
        func.count(
            func.distinct(
                case(
                    (Complaint.severity >= 70, Complaint.ward_id),
                )
            )
        ).label("high_priority_areas"),
        func.count(
            case(
                (Complaint.status == "resolved", Complaint.id),
            )
        ).label("pending_verifications"),
        func.count(
            case(
                (
                    (Complaint.status.in_(["resolved", "verified"]))
                    & (Complaint.updated_at >= month_start),
                    Complaint.id,
                ),
            )
        ).label("resolved_this_month"),
    )

    result = await db.execute(query)
    row = result.one()

    data = {
        "total_complaints": row.total_complaints or 0,
        "active_complaints": row.active_complaints or 0,
        "high_priority_areas": row.high_priority_areas or 0,
        "pending_verifications": row.pending_verifications or 0,
        "active_projects": 0,
        "resolved_this_month": row.resolved_this_month or 0,
        "avg_resolution_score": 0.0,
    }

    _summary_cache["data"] = data
    _summary_cache["timestamp"] = now_ts

    return data


@router.get("/trends")
async def dashboard_trends(
    days: int = 30,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complaint trends over the last N days."""
    from datetime import datetime, timedelta, timezone

    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Daily complaint counts
    date_trunc_expr = func.date_trunc(text("'day'"), Complaint.created_at)
    daily_result = await db.execute(
        select(
            date_trunc_expr.label("date"),
            func.count(Complaint.id).label("count"),
            func.avg(Complaint.severity).label("avg_severity"),
        )
        .where(Complaint.created_at >= start_date)
        .group_by(date_trunc_expr)
        .order_by(date_trunc_expr)
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
