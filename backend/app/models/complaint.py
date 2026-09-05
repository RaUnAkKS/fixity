import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Integer, Float, Enum as SAEnum,
    DateTime, ForeignKey, func,
)
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

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Complaint {self.id} [{self.status}]>"
