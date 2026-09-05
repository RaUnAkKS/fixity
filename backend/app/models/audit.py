import uuid

from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry

from app.database import Base


class AuditLog(Base):
    """Audit log for tracking officer actions and system events."""

    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.entity_type}>"


class Department(Base):
    """Government department responsible for handling complaints."""

    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<Department {self.name}>"


class District(Base):
    """Administrative district."""

    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    boundary = Column(Geometry("POLYGON", srid=4326), nullable=True)

    def __repr__(self) -> str:
        return f"<District {self.name}>"


class Ward(Base):
    """Administrative ward within a district."""

    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    boundary = Column(Geometry("POLYGON", srid=4326), nullable=True)
    population = Column(Integer, default=0)
    infrastructure_score = Column(Float, default=0.5)

    def __repr__(self) -> str:
        return f"<Ward {self.name}>"
