import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Integer, Float, Enum as SAEnum,
    DateTime, ForeignKey, func,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry

from app.database import Base


class Complaint(Base):
    """Civic complaint submitted by a citizen."""

    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    parent_issue_id = Column(
        UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=True, index=True
    )
    merged_reports_count = Column(
        Integer, default=0, nullable=False, server_default="0"
    )
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)
    detected_language = Column(String(10), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    subcategory = Column(String(100), nullable=True)
    ai_description = Column(Text, nullable=True)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    address = Column(Text, nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)

    # Scoring & status
    severity = Column(Integer, nullable=True)
    status = Column(
        SAEnum(
            "submitted", "analyzing", "analyzed", "assigned",
            "in_progress", "resolved", "verified",
            name="complaint_status",
        ),
        nullable=False,
        default="submitted",
        index=True,
    )
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    cluster_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    # cluster FK added later via migration once complaint_clusters table exists

    ai_analysis = Column(JSONB, nullable=True)
    confirmation_count = Column(Integer, default=0, nullable=False, server_default="0", index=True)

    created_at = Column(

        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    citizen = relationship("User", foreign_keys=[citizen_id], lazy="selectin")

    @property
    def reporter_reputation(self) -> int:
        if self.citizen:
            return self.citizen.civic_reputation or 0
        return 0

    @property
    def reporter_name(self) -> str:
        if self.citizen:
            return self.citizen.full_name or "Citizen"
        return "Citizen"

    @property
    def community_signal(self) -> str:
        from app.services.reputation_service import get_community_signal
        return get_community_signal(self.confirmation_count, self.severity)["signal"]

    @property
    def community_signal_score(self) -> int:
        from app.services.reputation_service import get_community_signal
        return get_community_signal(self.confirmation_count, self.severity)["score"]

    @property
    def is_community_critical(self) -> bool:
        from app.services.reputation_service import get_community_signal
        return get_community_signal(self.confirmation_count, self.severity)["is_community_critical"]

    def __repr__(self) -> str:
        return f"<Complaint {self.id} [{self.status}]>"
