import io
import logging
import os
from typing import Any

from PIL import Image, ExifTags

from app.ai.gemini_client import GeminiClient
from app.ai.prompts import (
    IMAGE_ANALYSIS_PROMPT,
    IMAGE_ANALYSIS_SCHEMA,
    PHOTO_AUTOSCAN_PROMPT,
    PHOTO_AUTOSCAN_SCHEMA,
)
from app.ai.schemas import ImageAnalysisOutput, PhotoAutoscanOutput

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
                response_schema=IMAGE_ANALYSIS_SCHEMA,
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

    async def scan_photo(
        self,
        image_bytes: bytes,
        mime_type: str,
    ) -> dict[str, Any]:
        """
        AI Auto-Scan & Detection for accessible reporting.
        Analyzes photo using Gemini multimodal to auto-fill complaint fields:
        description, category, subcategory, severity, issues, department,
        and extracts GPS coordinates from EXIF tags if available.
        """
        if not image_bytes:
            raise ValueError("Image bytes cannot be empty")

        # 1. Extract EXIF GPS coordinates if present
        lat, lng = self.extract_exif_gps(image_bytes)

        # 2. Multimodal AI Analysis
        try:
            result = await self.gemini.analyze_image(
                image_bytes=image_bytes,
                mime_type=mime_type,
                prompt=PHOTO_AUTOSCAN_PROMPT,
                response_schema=PHOTO_AUTOSCAN_SCHEMA,
            )
            # Ensure expected types & defaults
            if not isinstance(result, dict):
                raise ValueError("Expected dictionary from AI response")

            result.setdefault("category", "Road Infrastructure")
            result.setdefault("subcategory", "General Civic Issue")
            result.setdefault("severity", 50)
            result.setdefault("detected_issues", [])
            result.setdefault("suggested_department", "Municipal Public Works Department")
            result.setdefault("is_relevant", True)
            result.setdefault("description", "Civic infrastructure problem detected from photo.")

            # Inject location metadata
            result["latitude"] = lat
            result["longitude"] = lng
            result["has_exif_gps"] = lat is not None and lng is not None

            validated = PhotoAutoscanOutput(**result)
            return validated.model_dump()
        except Exception as e:
            logger.warning("Photo auto-scan AI call failed, using fallback heuristic: %s", e)
            fallback = {
                "description": "Civic issue detected from uploaded photo. Please verify details and submit.",
                "category": "Road Infrastructure",
                "subcategory": "General Infrastructure",
                "severity": 50,
                "detected_issues": ["Physical infrastructure damage or maintenance required"],
                "suggested_department": "Municipal Public Works Department",
                "is_relevant": True,
                "latitude": lat,
                "longitude": lng,
                "has_exif_gps": lat is not None and lng is not None,
            }
            validated = PhotoAutoscanOutput(**fallback)
            return validated.model_dump()

    @staticmethod

    def extract_exif_gps(image_bytes: bytes) -> tuple[float | None, float | None]:
        """Extract (latitude, longitude) from EXIF metadata in photo bytes."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            exif = image._getexif()
            if not exif:
                return None, None

            gps_info = {}
            for tag, value in exif.items():
                decoded = ExifTags.TAGS.get(tag, tag)
                if decoded == "GPSInfo":
                    for t in value:
                        sub_decoded = ExifTags.GPSTAGS.get(t, t)
                        gps_info[sub_decoded] = value[t]

            if not gps_info:
                return None, None

            def _convert_to_degrees(value):
                d = float(value[0])
                m = float(value[1])
                s = float(value[2])
                return d + (m / 60.0) + (s / 3600.0)

            lat = None
            lng = None
            if "GPSLatitude" in gps_info and "GPSLatitudeRef" in gps_info:
                lat = _convert_to_degrees(gps_info["GPSLatitude"])
                if str(gps_info["GPSLatitudeRef"]).upper() == "S":
                    lat = -lat
            if "GPSLongitude" in gps_info and "GPSLongitudeRef" in gps_info:
                lng = _convert_to_degrees(gps_info["GPSLongitude"])
                if str(gps_info["GPSLongitudeRef"]).upper() == "W":
                    lng = -lng

            return lat, lng
        except Exception as e:
            logger.debug("Could not parse EXIF GPS: %s", e)
            return None, None

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

