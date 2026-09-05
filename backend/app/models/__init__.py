# CivicAI Database Models
# Import all models here so Alembic and Base.metadata can discover them.

from app.models.user import User  # noqa: F401
from app.models.complaint import Complaint  # noqa: F401
from app.models.evidence import ComplaintEvidence  # noqa: F401
from app.models.audit import AuditLog, Department, District, Ward  # noqa: F401
