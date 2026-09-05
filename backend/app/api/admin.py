from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import require_role
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.auth import UserResponse
from app.seed.seed_data import run_all_seeds

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/seed")
async def seed_database(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Seed the database with departments, districts, wards, and demo users."""
    result = await run_all_seeds(db)
    return {"seeded": result}


@router.get("/users")
async def list_users(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {
        "items": [UserResponse.model_validate(u) for u in users]
    }


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role_data: dict,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role (admin only)."""
    new_role = role_data.get("role")
    if new_role not in ("citizen", "officer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'citizen', 'officer', or 'admin'",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.role = new_role
    await db.flush()
    await db.refresh(user)
    return {"id": str(user.id), "role": user.role}


@router.get("/categories")
async def get_categories(
    current_user: User = Depends(require_role("admin")),
):
    """Get the predefined complaint categories."""
    return {
        "categories": [
            "Road Infrastructure",
            "Water Supply",
            "Drainage & Sewage",
            "Sanitation & Waste",
            "Electricity",
            "Healthcare",
            "Education",
            "Public Transport",
            "Parks & Recreation",
            "Building & Construction",
            "Pollution",
            "Public Safety",
            "Other",
        ]
    }


@router.get("/stats")
async def admin_stats(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get system-wide admin stats."""
    total_users = await db.execute(select(func.count(User.id)))
    total_complaints = await db.execute(select(func.count(Complaint.id)))

    return {
        "total_users": total_users.scalar() or 0,
        "total_complaints": total_complaints.scalar() or 0,
        "ai_calls_today": 0,  # Populated when AI tracking is added
        "errors_today": 0,
    }
