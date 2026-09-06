import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Enum as SAEnum, DateTime, func

from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    """User model — citizens, officers, and admins."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(
        SAEnum("citizen", "officer", "admin", name="user_role"),
        nullable=False,
        default="citizen",
        index=True,
    )
    preferred_language = Column(String(10), default="en")

    # Civic Reputation & Community Contribution Metrics
    civic_reputation = Column(Integer, default=0, nullable=False, server_default="0")
    reports_count = Column(Integer, default=0, nullable=False, server_default="0")
    confirmed_reports_count = Column(Integer, default=0, nullable=False, server_default="0")
    verified_resolutions_count = Column(Integer, default=0, nullable=False, server_default="0")
    community_confirmations_count = Column(Integer, default=0, nullable=False, server_default="0")

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def civic_level(self) -> str:
        from app.services.reputation_service import get_civic_level
        return get_civic_level(self.civic_reputation)

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
