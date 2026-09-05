"""
Image Analysis Service
======================
Handles multimodal photo evidence understanding using Google Gemini 2.0 Flash.
Extracts visible civic infrastructure issues, estimates visual severity (1-100),
evaluates relevance, and validates output against Pydantic models.
"""

import logging
import os
from typing import Any

from app.ai.gemini_client import GeminiClient
from app.ai.prompts import IMAGE_ANALYSIS_PROMPT, IMAGE_ANALYSIS_SCHEMA
from app.ai.schemas import ImageAnalysisOutput

logger = logging.getLogger(__name__)


class ImageService:
    """Service for multimodal visual analysis of civic complaint photo evidence."""

    def __init__(self):
        self.gemini = GeminiClient()

    async def analyze_image(
        self,
        image_path: str,
        complaint_text: str = "",
    ) -> dict[str, Any]:
        """
        Analyze a civic photo from local disk using Gemini multimodal.

        Args:
            image_path: Path to the image file on disk.
            complaint_text: Accompanying complaint text for contextual understanding.

        Returns:
            Dict matching ImageAnalysisOutput schema:
            {
                "detected_issues": list[str],
                "severity_estimate": int,
                "description": str,
                "confidence": "high" | "medium" | "low",
                "is_relevant": bool
            }
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        mime_type = self._get_mime_type(image_path)

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        return await self.analyze_image_bytes(
            image_bytes=image_bytes,
            mime_type=mime_type,
            complaint_text=complaint_text,
        )

    async def analyze_image_bytes(
        self,
        image_bytes: bytes,
        mime_type: str,
        complaint_text: str = "",
    ) -> dict[str, Any]:
        """
        Analyze raw image bytes using Gemini multimodal.

        Args:
            image_bytes: Raw binary content of the photo.
            mime_type: MIME type (e.g. 'image/jpeg', 'image/png', 'image/webp').
            complaint_text: Context string from user's report.

        Returns:
            Validated analysis dictionary.
        """
        if not image_bytes:
            raise ValueError("Image bytes cannot be empty")

        prompt = IMAGE_ANALYSIS_PROMPT.format(complaint_text=complaint_text or "No text provided")

        try:
            result = await self.gemini.analyze_image(
                image_bytes=image_bytes,
                mime_type=mime_type,
                prompt=prompt,
            )
            validated = ImageAnalysisOutput(**result)
            return validated.model_dump()
        except Exception as e:
            logger.error("Image analysis failed: %s", e)
            # Graceful fallback: return a default structured indicator rather than failing completely
            return {
                "detected_issues": [],
                "severity_estimate": 50,
                "description": f"Visual analysis unavailable: {str(e)}",
                "confidence": "low",
                "is_relevant": True,
            }

    @staticmethod
    def _get_mime_type(image_path: str) -> str:
        """Resolve image MIME type from file extension."""
        ext = os.path.splitext(image_path)[1].lower()
        if ext in (".jpg", ".jpeg"):
            return "image/jpeg"
        elif ext == ".png":
            return "image/png"
        elif ext == ".webp":
            return "image/webp"
        elif ext == ".gif":
            return "image/gif"
        elif ext == ".bmp":
            return "image/bmp"
        return "image/jpeg"
