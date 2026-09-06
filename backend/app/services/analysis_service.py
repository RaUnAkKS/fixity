"""
Complaint Analysis Service
==========================
Complaint analysis pipeline:
1. Retrieve complaint text (+ optional image context)
2. Send to Gemini 2.0 Flash for structured JSON extraction
3. Validate output with Pydantic
4. Fallback to Groq (Llama 3.3 70B) if Gemini fails
5. Store result in complaint_analysis table and update complaint record
6. Return structured analysis dictionary
"""

import json
import logging
from typing import Any
from uuid import UUID

from app.ai.gemini_client import GeminiClient
from app.ai.groq_client import GroqClient
from app.ai.prompts import (
    COMPLAINT_ANALYSIS_PROMPT,
    COMPLAINT_ANALYSIS_SCHEMA,
)
from app.ai.schemas import ComplaintAnalysisOutput

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service orchestrating AI text analysis for civic complaints."""

    def __init__(self):
        self.gemini = GeminiClient()
        self.groq = GroqClient()

    async def analyze_text_direct(self, text: str) -> dict[str, Any]:
        """
        Direct text analysis pipeline (useful for testing or standalone analysis).
        Tries Gemini first, falls back to Groq.
        """
        if not text or not text.strip():
            raise ValueError("Complaint text cannot be empty")

        clean_text = text.strip()
        try:
            prompt = COMPLAINT_ANALYSIS_PROMPT.format(complaint_text=clean_text)
            result = await self.gemini.analyze_text(
                text=clean_text,
                system_prompt=prompt,
                response_schema=COMPLAINT_ANALYSIS_SCHEMA,
            )
            validated = ComplaintAnalysisOutput(**result)
            return validated.model_dump()
        except Exception as gemini_err:
            logger.warning(
                "Gemini analysis failed (%s), attempting Groq fallback...",
                gemini_err,
            )
            try:
                result = await self._analyze_with_groq(text)
                validated = ComplaintAnalysisOutput(**result)
                return validated.model_dump()
            except Exception as groq_err:
                logger.warning("All LLM providers failed for direct text (%s). Using heuristic.", groq_err)
                heuristic_result = self._rule_based_analysis(text)
                validated = ComplaintAnalysisOutput(**heuristic_result)
                return validated.model_dump()

    async def analyze_complaint(self, complaint_id: UUID, db: Any) -> dict[str, Any]:
        """
        Full analysis pipeline for a complaint in the database.
        Called by POST /api/complaints/{id}/analyze endpoint.

        Args:
            complaint_id: UUID of complaint to analyze
            db: SQLAlchemy AsyncSession

        Returns:
            Dictionary matching ComplaintAnalysisResponse schema
        """
        from app.models.complaint import Complaint

        # 1. Fetch complaint
        complaint = await db.get(Complaint, complaint_id)
        if not complaint:
            raise ValueError(f"Complaint {complaint_id} not found")

        # 2. Update status to 'analyzing'
        complaint.status = "analyzing"
        await db.commit()
        await db.refresh(complaint)

        confidence = 0.85

        # 3. Call AI with fallback (Gemini -> Groq -> Heuristic)
        try:
            prompt = COMPLAINT_ANALYSIS_PROMPT.format(
                complaint_text=complaint.original_text
            )
            result = await self.gemini.analyze_text(
                text=complaint.original_text,
                system_prompt=prompt,
                response_schema=COMPLAINT_ANALYSIS_SCHEMA,
            )
            validated = ComplaintAnalysisOutput(**result)
        except Exception as gemini_err:
            logger.warning(
                "Gemini analysis failed for complaint %s: %s. Trying Groq fallback.",
                complaint_id,
                gemini_err,
            )
            try:
                result = await self._analyze_with_groq(complaint.original_text)
                validated = ComplaintAnalysisOutput(**result)
                confidence = 0.80
            except Exception as groq_err:
                logger.warning(
                    "All LLM providers failed for complaint %s (%s). Using heuristic fallback.",
                    complaint_id,
                    groq_err,
                )
                heuristic_result = self._rule_based_analysis(complaint.original_text)
                validated = ComplaintAnalysisOutput(**heuristic_result)
                confidence = 0.60

        analysis_data = validated.model_dump()

        # 4. Update Complaint entity directly
        complaint.translated_text = validated.translated_text
        complaint.detected_language = validated.detected_language
        complaint.category = validated.category
        complaint.subcategory = validated.subcategory
        complaint.severity = validated.severity
        complaint.ai_description = validated.summary
        complaint.ai_analysis = analysis_data
        complaint.status = "analyzed"

        await db.commit()
        await db.refresh(complaint)

        return {
            "complaint_id": complaint_id,
            "detected_language": validated.detected_language,
            "translated_text": validated.translated_text,
            "category": validated.category,
            "subcategory": validated.subcategory,
            "severity": validated.severity,
            "issues": validated.issues,
            "possible_related_issue": validated.possible_related_issue,
            "suggested_department": validated.suggested_department,
            "summary": validated.summary,
            "confidence": confidence,
        }

    async def _analyze_with_groq(self, text: str) -> dict[str, Any]:
        """Fallback analysis using Groq."""
        prompt = (
            f"{COMPLAINT_ANALYSIS_PROMPT.format(complaint_text=text)}\n\n"
            f"You MUST return ONLY a valid JSON object matching this schema:\n"
            f"{json.dumps(COMPLAINT_ANALYSIS_SCHEMA)}"
        )
        messages = [{"role": "user", "content": prompt}]
        return await self.groq.chat_completion_json(
            messages=messages,
            system_prompt="You are a civic complaint analysis engine that outputs only valid JSON.",
        )

    def _rule_based_analysis(self, text: str) -> dict[str, Any]:
        """Deterministic keyword-based heuristic fallback if all remote AI APIs are offline."""
        lower = text.lower()

        category = "Road Infrastructure"
        subcategory = "Pothole / Road Surface"
        suggested_dept = "Public Works Department"
        severity = 55

        if any(w in lower for w in ["water", "leak", "pipe", "tank", "supply", "drinking"]):
            category = "Water Supply"
            subcategory = "Pipeline Leakage"
            suggested_dept = "Water Supply & Sewerage Board"
            severity = 65
        elif any(w in lower for w in ["drain", "sewage", "gutter", "overflow", "manhole", "clog"]):
            category = "Drainage & Sewage"
            subcategory = "Drainage Blockage"
            suggested_dept = "Drainage & Sewage Department"
            severity = 70
        elif any(w in lower for w in ["garbage", "trash", "waste", "dump", "clean", "debris", "smell", "sanitation"]):
            category = "Sanitation & Waste"
            subcategory = "Garbage Collection"
            suggested_dept = "Solid Waste Management"
            severity = 50
        elif any(w in lower for w in ["light", "pole", "wire", "power", "electric", "dark", "transformer"]):
            category = "Electricity"
            subcategory = "Streetlight / Power Issue"
            suggested_dept = "Electricity Board"
            severity = 60
        elif any(w in lower for w in ["pothole", "road", "cavity", "asphalt", "traffic", "footpath", "bridge"]):
            category = "Road Infrastructure"
            subcategory = "Road Repair & Potholes"
            suggested_dept = "Public Works Department"
            severity = 65
        elif any(w in lower for w in ["hospital", "clinic", "health", "doctor", "medicine"]):
            category = "Healthcare"
            subcategory = "Public Health"
            suggested_dept = "Health Department"
            severity = 75
        elif any(w in lower for w in ["bus", "transport", "auto", "stop", "station"]):
            category = "Public Transport"
            subcategory = "Transit Facilities"
            suggested_dept = "Transport Department"
            severity = 45

        if any(w in lower for w in ["severe", "danger", "hazard", "fatal", "accident", "emergency", "urgent", "critical"]):
            severity = min(100, severity + 20)

        issues = [f"{category} issue reported", subcategory]

        return {
            "detected_language": "en",
            "translated_text": text,
            "category": category,
            "subcategory": subcategory,
            "severity": severity,
            "issues": issues,
            "possible_related_issue": f"Recurring {category.lower()} in area",
            "suggested_department": suggested_dept,
            "summary": text[:200] if len(text) > 200 else text,
        }

