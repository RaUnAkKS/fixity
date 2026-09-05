import uuid
from datetime import datetime

from sqlalchemy import Column, String, Enum as SAEnum, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class ComplaintEvidence(Base):
    """Evidence attached to a complaint (photo, audio, document)."""

    __tablename__ = "complaint_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_type = Column(
        SAEnum("photo", "audio", "document", name="evidence_type"),
        nullable=False,
    )
    file_path = Column(String(512), nullable=False)
    file_url = Column(String(512), nullable=True)
    mime_type = Column(String(100), nullable=True)
    ai_analysis = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Evidence {self.id} ({self.evidence_type})>"
