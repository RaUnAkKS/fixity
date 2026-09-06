import uuid
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ComplaintConfirmation(Base):
    """
    Community confirmation of an existing civic complaint.
    Represents 'I am affected too' / 'Confirm this issue' signal from nearby citizens.
    Enforces exactly one confirmation per user per complaint.
    """

    __tablename__ = "complaint_confirmations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "complaint_id",
            name="uq_user_complaint_confirmation",
        ),
    )

    def __repr__(self) -> str:
        return f"<ComplaintConfirmation user={self.user_id} complaint={self.complaint_id}>"
