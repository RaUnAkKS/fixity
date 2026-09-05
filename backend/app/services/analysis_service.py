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
                logger.error("All AI providers failed for text analysis: %s", groq_err)
                raise RuntimeError(
                    f"AI analysis unavailable (Gemini: {gemini_err}, Groq: {groq_err})"
                ) from groq_err

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
        # Dynamic import of models to avoid circular dependencies
        try:
            from app.models.complaint import Complaint
            from app.models.analysis import ComplaintAnalysis
        except ImportError:
            # If Person A's models are structured slightly differently or named differently
            from app.models import Complaint, ComplaintAnalysis  # type: ignore

        # 1. Fetch complaint
        complaint = await db.get(Complaint, complaint_id)
        if not complaint:
            raise ValueError(f"Complaint {complaint_id} not found")

        # 2. Update status to 'analyzing'
        complaint.status = "analyzing"
        await db.commit()
        await db.refresh(complaint)

        model_used = "gemini-2.0-flash"
        confidence = 0.85

        # 3. Call AI with fallback
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
            model_used = "gemini-2.0-flash"
        except Exception as gemini_err:
            logger.warning(
                "Gemini analysis failed for complaint %s: %s. Trying Groq fallback.",
                complaint_id,
                gemini_err,
            )
            try:
                result = await self._analyze_with_groq(complaint.original_text)
                validated = ComplaintAnalysisOutput(**result)
                model_used = "groq-llama-3.3-70b"
                confidence = 0.75
            except Exception as groq_err:
                logger.error("All AI providers failed for complaint %s: %s", complaint_id, groq_err)
                complaint.status = "submitted"  # Reset status so it can be retried
                await db.commit()
                raise RuntimeError("AI analysis temporarily unavailable") from groq_err

        # 4. Create or update ComplaintAnalysis record
        analysis_data = validated.model_dump()
        analysis = ComplaintAnalysis(
            complaint_id=complaint_id,
            model_used=model_used,
            structured_output=analysis_data,
            extracted_issues=validated.issues,
            suggested_category=validated.category,
            suggested_severity=validated.severity,
            suggested_department=validated.suggested_department,
            confidence=confidence,
        )
        db.add(analysis)

        # 5. Update Complaint entity
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
            "id": getattr(analysis, "id", None),
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
        """Fallback analysis using Groq Llama 3.3 70B."""
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
