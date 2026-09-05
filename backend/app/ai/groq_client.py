"""
Wrapper for Groq API.
Handles: Whisper speech-to-text (large-v3-turbo), backup LLM (Llama 3.3 70B).

Critical rules:
  - Whisper has a 25 MB file size limit
  - Pass language hint (e.g. "hi" for Hindi) when available to improve accuracy
  - Backup LLM is used only when Gemini is unavailable
  - All calls have retry with backoff
  - Never send citizen PII — only complaint text
"""

import asyncio
import json
import logging
from typing import Any

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Async wrapper around the Groq SDK for Whisper STT and Llama backup LLM."""

    def __init__(self):
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set — Groq calls will fail")
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    # ------------------------------------------------------------------
    # Speech-to-Text (Whisper)
    # ------------------------------------------------------------------

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        language: str | None = None,
    ) -> dict:
        """
        Transcribe audio using Whisper large-v3-turbo via Groq.

        Args:
            audio_bytes: Raw audio file bytes.
            filename:    Original filename (used for extension detection).
            language:    Optional ISO 639-1 language hint (e.g. "hi", "en", "bn").

        Returns:
            {
                "text": str,              # Transcribed text
                "detected_language": str,  # ISO code
                "confidence": float        # Average log probability
            }
        """

        async def _call():
            response = await asyncio.to_thread(
                self.client.audio.transcriptions.create,
                model="whisper-large-v3-turbo",
                file=(filename, audio_bytes),
                language=language,
                response_format="verbose_json",
            )
            return {
                "text": response.text,
                "detected_language": (
                    getattr(response, "language", None) or language or "unknown"
                ),
                "confidence": getattr(response, "avg_logprob", 0.0),
            }

        return await self._call_with_retry(_call, max_retries=2)

    # ------------------------------------------------------------------
    # Backup LLM (Llama 3.3 70B)
    # ------------------------------------------------------------------

    async def chat_completion(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> str:
        """
        Backup LLM using Llama 3.3 70B Versatile with automatic model fallbacks.

        Used when Gemini is unavailable for text analysis.
        Returns plain text response (caller must parse JSON if needed).

        Args:
            messages: List of {"role": "user"|"assistant", "content": str}.
            system_prompt: System instruction.

        Returns:
            Plain text response string.
        """
        candidate_models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "llama-3.1-8b-instant",
            "llama3-70b-8192",
            "mixtral-8x7b-32768",
        ]

        async def _call():
            last_err = None
            for model_name in candidate_models:
                try:
                    response = await asyncio.to_thread(
                        self.client.chat.completions.create,
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            *messages,
                        ],
                        temperature=0.3,
                        max_tokens=2000,
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    last_err = e
                    if "model_not_found" in str(e) or "404" in str(e):
                        continue
                    raise
            raise last_err

        return await self._call_with_retry(_call, max_retries=1)

    async def chat_completion_json(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> dict:
        """
        Backup LLM that returns parsed JSON.

        Same as chat_completion but instructs the model to return JSON
        and parses the result. Used as Gemini structured-output fallback.

        Args:
            messages: List of message dicts.
            system_prompt: System instruction (should ask for JSON output).

        Returns:
            Parsed JSON dict.

        Raises:
            ValueError: If response is not valid JSON.
        """
        json_system = (
            system_prompt
            + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation."
        )

        raw = await self.chat_completion(messages, json_system)

        # Strip markdown code fences if present
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("Groq returned invalid JSON: %s", e)
            logger.debug("Raw response: %s", text[:500])
            raise ValueError(f"Groq returned invalid JSON: {e}") from e

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _call_with_retry(self, func, max_retries: int = 2) -> Any:
        """Retry wrapper with exponential backoff."""
        for attempt in range(max_retries + 1):
            try:
                result = await func()
                logger.debug(
                    "Groq API call succeeded on attempt %d", attempt + 1
                )
                return result
            except Exception as e:
                logger.error(
                    "Groq API error (attempt %d/%d): %s",
                    attempt + 1,
                    max_retries + 1,
                    e,
                )
                if attempt < max_retries:
                    wait = 1 * (attempt + 1)  # 1s, 2s backoff
                    await asyncio.sleep(wait)
                else:
                    raise
