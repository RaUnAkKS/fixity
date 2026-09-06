import logging
from uuid import UUID
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.complaint import Complaint
from app.models.confirmation import ComplaintConfirmation

logger = logging.getLogger(__name__)


# ── Civic Levels ──
CIVIC_LEVEL_THRESHOLDS = [
    (100, "Civic Champion"),
    (75, "Community Contributor"),
    (50, "Trusted Citizen"),
    (25, "Active Citizen"),
    (0, "New Citizen"),
]


def get_civic_level(reputation: int) -> str:
    """Derive civic level title from integer reputation score."""
    rep = max(0, reputation or 0)
    for threshold, title in CIVIC_LEVEL_THRESHOLDS:
        if rep >= threshold:
            return title
    return "New Citizen"


def get_community_signal(confirmation_count: int, severity: int | None = None) -> dict[str, Any]:
    """
    Calculate Community Signal level, numeric score (1-10), and officer critical flag.

    Formula:
      - 0 confirmations: Low (1/10)
      - 1-3 confirmations: Moderate (4/10)
      - 4-7 confirmations: Elevated (7/10)
      - 8+ confirmations: High (10/10)
    """
    count = max(0, confirmation_count or 0)
    if count == 0:
        signal = "Low"
        score = 1
    elif count <= 3:
        signal = "Moderate"
        score = min(10, 1 + count * 1)
    elif count <= 7:
        signal = "Elevated"
        score = min(10, 3 + count)
    else:
        signal = "High"
        score = 10

    # Officer Prioritization flag: High visual severity + verified community impact
    is_community_critical = bool((severity or 0) >= 70 and count >= 3)

    return {
        "signal": signal,
        "score": score,
        "is_community_critical": is_community_critical,
    }


class ReputationService:
    """Service managing deterministic civic reputation and community confirmations."""

    @staticmethod
    async def confirm_complaint(
        db: AsyncSession,
        complaint_id: UUID,
        user_id: UUID,
    ) -> dict[str, Any]:
        """
        Record a community confirmation ('I'm affected too') on a civic complaint.
        
        Enforces:
          1. Complaint must exist.
          2. Citizen cannot confirm their own complaint.
          3. Citizen cannot confirm the same complaint multiple times.
          4. Awards +2 reputation to confirming citizen.
          5. Awards +2 reputation to author (capped at max +10 per complaint).
        """
        complaint = await db.get(Complaint, complaint_id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found",
            )

        # Rule: Only citizens can confirm issues (officers/admins triage and manage)
        confirming_user = await db.get(User, user_id)
        if not confirming_user or confirming_user.role != "citizen":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only citizens can submit community confirmations",
            )

        # Rule: One confirmation per citizen per complaint
        query = select(ComplaintConfirmation).where(
            ComplaintConfirmation.complaint_id == complaint_id,
            ComplaintConfirmation.user_id == user_id,
        )
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already confirmed this issue",
            )

        # 1. Create confirmation record
        confirmation = ComplaintConfirmation(
            complaint_id=complaint_id,
            user_id=user_id,
        )
        db.add(confirmation)

        # 2. Update complaint confirmation count
        current_count = (complaint.confirmation_count or 0) + 1
        complaint.confirmation_count = current_count

        is_self_confirm = bool(complaint.citizen_id == user_id)

        # 3. Reward confirming citizen (+2 points) when confirming neighbor issues
        confirming_user = await db.get(User, user_id)
        if confirming_user and not is_self_confirm:
            confirming_user.civic_reputation = (confirming_user.civic_reputation or 0) + 2
            confirming_user.community_confirmations_count = (
                confirming_user.community_confirmations_count or 0
            ) + 1

        # 4. Reward complaint author (+2 points per neighbor confirmation, capped at +10 total / 5 confirmations)
        if not is_self_confirm:
            author = await db.get(User, complaint.citizen_id)
            if author:
                if current_count <= 5:
                    author.civic_reputation = (author.civic_reputation or 0) + 2
                if current_count == 1:
                    author.confirmed_reports_count = (author.confirmed_reports_count or 0) + 1

        await db.commit()
        await db.refresh(complaint)

        signal = get_community_signal(complaint.confirmation_count, complaint.severity)

        return {
            "confirmed": True,
            "confirmation_count": complaint.confirmation_count,
            "community_signal": signal["signal"],
            "community_signal_score": signal["score"],
            "is_community_critical": signal["is_community_critical"],
            "user_has_confirmed": True,
        }

    @staticmethod
    async def get_community_status(
        db: AsyncSession,
        complaint_id: UUID,
        user_id: UUID | None = None,
    ) -> dict[str, Any]:
        """Get community confirmations and signal for a complaint."""
        complaint = await db.get(Complaint, complaint_id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found",
            )

        user_has_confirmed = False
        if user_id:
            query = select(ComplaintConfirmation).where(
                ComplaintConfirmation.complaint_id == complaint_id,
                ComplaintConfirmation.user_id == user_id,
            )
            res = await db.execute(query)
            user_has_confirmed = res.scalar_one_or_none() is not None

        count = complaint.confirmation_count or 0
        signal = get_community_signal(count, complaint.severity)

        return {
            "complaint_id": complaint_id,
            "confirmation_count": count,
            "community_signal": signal["signal"],
            "community_signal_score": signal["score"],
            "is_community_critical": signal["is_community_critical"],
            "user_has_confirmed": user_has_confirmed,
            "is_author": bool(user_id and complaint.citizen_id == user_id),
        }

    @staticmethod
    async def award_report_reputation(
        db: AsyncSession,
        user_id: UUID,
    ) -> None:
        """Award +5 reputation to citizen for submitting a valid complaint."""
        user = await db.get(User, user_id)
        if user:
            user.civic_reputation = (user.civic_reputation or 0) + 5
            user.reports_count = (user.reports_count or 0) + 1
            await db.flush()

    @staticmethod
    async def award_resolution_reputation(
        db: AsyncSession,
        complaint: Complaint,
    ) -> None:
        """Award +5 reputation when citizen's complaint is resolved."""
        # Ensure points are only awarded once via flag in ai_analysis metadata
        analysis = dict(complaint.ai_analysis or {})
        if analysis.get("_resolution_rep_awarded"):
            return

        author = await db.get(User, complaint.citizen_id)
        if author:
            author.civic_reputation = (author.civic_reputation or 0) + 5
            analysis["_resolution_rep_awarded"] = True
            complaint.ai_analysis = analysis
            await db.flush()

    @staticmethod
    async def award_verification_reputation(
        db: AsyncSession,
        complaint: Complaint,
    ) -> None:
        """Award +5 reputation when citizen verifies their complaint."""
        analysis = dict(complaint.ai_analysis or {})
        if analysis.get("_verification_rep_awarded"):
            return

        author = await db.get(User, complaint.citizen_id)
        if author:
            author.civic_reputation = (author.civic_reputation or 0) + 5
            author.verified_resolutions_count = (author.verified_resolutions_count or 0) + 1
            analysis["_verification_rep_awarded"] = True
            complaint.ai_analysis = analysis
            await db.flush()

    @staticmethod
    def get_reputation_detail(user: User) -> dict[str, Any]:
        """Build transparent reputation summary and point breakdown."""
        rep = user.civic_reputation or 0
        reports = user.reports_count or 0
        confirmed = user.confirmed_reports_count or 0
        verified = user.verified_resolutions_count or 0
        confirmations_given = user.community_confirmations_count or 0

        # Deterministic breakdown
        reports_pts = reports * 5
        confirmations_given_pts = confirmations_given * 2
        verified_pts = verified * 5
        other_pts = max(0, rep - (reports_pts + confirmations_given_pts + verified_pts))

        return {
            "civic_reputation": rep,
            "civic_level": get_civic_level(rep),
            "reports_count": reports,
            "confirmed_reports_count": confirmed,
            "verified_resolutions_count": verified,
            "community_confirmations_count": confirmations_given,
            "breakdown": {
                "valid_reports_points": reports_pts,
                "confirmations_given_points": confirmations_given_pts,
                "verified_resolutions_points": verified_pts,
                "community_bonuses_points": other_pts,
            },
        }
