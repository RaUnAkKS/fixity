from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID


class CopilotAction(BaseModel):
    """UI action triggered by Copilot reasoning to control map and dashboard."""
    type: str = Field(..., description="Action type: FOCUS_MAP, HIGHLIGHT_COMPLAINTS, FILTER_VIEW, OPEN_MODAL")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zoom: Optional[int] = 14
    ward_id: Optional[int] = None
    category: Optional[str] = None
    highlight_complaint_ids: Optional[List[str]] = []
    metadata: Optional[Dict[str, Any]] = None


class CopilotChatMessage(BaseModel):
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., description="Message text content")


class CopilotChatRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=2000, description="Officer civic inquiry or command")
    ward_id: Optional[int] = Field(None, description="Optional targeted ward ID")
    category: Optional[str] = Field(None, description="Optional targeted category")
    conversation_history: Optional[List[CopilotChatMessage]] = Field(default_factory=list)


class CopilotChatResponse(BaseModel):
    answer: str
    key_findings: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    data: Optional[Dict[str, Any]] = None
    sources: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    actions: List[CopilotAction] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)


class CriticalAlertItem(BaseModel):
    ward_id: int
    ward_name: str
    category: str
    active_complaints: int
    avg_severity: float
    community_confirmations: int
    urgency: str
    summary: str


class CopilotBriefingResponse(BaseModel):
    headline: str
    priority_level: str  # "Normal" | "Elevated" | "Critical"
    summary: str
    critical_alerts: List[CriticalAlertItem] = Field(default_factory=list)
    workload_summary: Dict[str, Any] = Field(default_factory=dict)
    citizen_trust_metric: Dict[str, Any] = Field(default_factory=dict)
    generated_at: str


class CopilotSuggestionItem(BaseModel):
    title: str
    query: str
    category: str
    icon: Optional[str] = None
