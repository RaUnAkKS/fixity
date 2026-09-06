"""
Speech-to-Text Service
======================
Handles speech transcription using Groq Whisper (model: whisper-large-v3-turbo).
Supports multilingual input (Hindi, English, Bengali, Tamil, etc.) with language hints.
Includes fallback handling.
"""

import logging
from typing import Any

from app.ai.gemini_client import GeminiClient
from app.ai.groq_client import GroqClient
from app.ai.schemas import AudioTranscriptionOutput

logger = logging.getLogger(__name__)


LANGUAGE_NAME_TO_CODE = {
    "hindi": "hi",
    "english": "en",
    "bengali": "bn",
    "tamil": "ta",
    "telugu": "te",
    "marathi": "mr",
    "gujarati": "gu",
    "kannada": "kn",
    "malayalam": "ml",
    "punjabi": "pa",
    "urdu": "ur",
}


class SpeechService:
    """Service for transcribing spoken complaints in multiple Indian languages."""

    def __init__(self):
        self.groq = GroqClient()
        self.gemini = GeminiClient()

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        language: str | None = None,
    ) -> dict[str, Any]:
        """
        Transcribe audio to text.

        Args:
            audio_bytes: Raw bytes of the uploaded audio file.
            filename: Original file name (e.g. 'audio.mp3', 'voice.wav', 'recording.m4a').
            language: Optional ISO 639-1 language code (e.g. 'hi' for Hindi, 'en', 'bn').

        Returns:
            {
                "text": str,
                "detected_language": str,
                "confidence": float
            }
        """
        try:
            result = await self.groq.transcribe_audio(
                audio_bytes=audio_bytes,
                filename=filename,
                language=language,
            )
            raw_lang = (result.get("detected_language") or language or "en").lower().strip()
            # Map full name if needed
            normalized_lang = LANGUAGE_NAME_TO_CODE.get(raw_lang, raw_lang)
            result["detected_language"] = normalized_lang

            validated = AudioTranscriptionOutput(**result)
            return validated.model_dump()

        except Exception as groq_err:
            logger.warning(
                "Groq Whisper transcription failed: %s. Attempting Gemini multimodal audio fallback...",
                groq_err,
            )
            try:
                return await self._fallback_gemini_audio(audio_bytes, filename, language)
            except Exception as gemini_err:
                logger.error("All STT providers failed: %s", gemini_err)
                raise RuntimeError(
                    f"Speech transcription failed (Groq: {groq_err}, Gemini: {gemini_err})"
                ) from gemini_err

    async def _fallback_gemini_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        language: str | None = None,
    ) -> dict[str, Any]:
        """Fallback transcription using Gemini native multimodal audio support."""
        mime_type = self._get_mime_type(filename)
        prompt = (
            "Transcribe this audio recording accurately. "
            "Return ONLY a JSON object with: "
            '{"text": "<transcription>", "detected_language": "<iso_code>", "confidence": 0.8}'
        )
        if language:
            prompt += f" Note: The spoken language is likely '{language}'."

        result = await self.gemini.analyze_image(
            image_bytes=audio_bytes,
            mime_type=mime_type,
            prompt=prompt,
        )
        validated = AudioTranscriptionOutput(
            text=result.get("text", ""),
            detected_language=result.get("detected_language", language or "en"),
            confidence=float(result.get("confidence", 0.8)),
        )
        return validated.model_dump()

    @staticmethod
    def _get_mime_type(filename: str) -> str:
        """Helper to resolve audio mime type from filename."""
        fn = filename.lower()
        if fn.endswith(".mp3"):
            return "audio/mp3"
        elif fn.endswith(".wav"):
            return "audio/wav"
        elif fn.endswith(".m4a"):
            return "audio/m4a"
        elif fn.endswith(".ogg") or fn.endswith(".oga"):
            return "audio/ogg"
        elif fn.endswith(".webm"):
            return "audio/webm"
        elif fn.endswith(".aac"):
            return "audio/aac"
        elif fn.endswith(".flac"):
            return "audio/flac"
        return "audio/mpeg"
