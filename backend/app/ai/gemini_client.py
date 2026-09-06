"""
Wrapper for Google Gemini API.
Handles: structured JSON output, multimodal input, function calling, error handling.

Models used:
  - gemini-2.0-flash  → structured text analysis, image analysis, embeddings
  - gemini-2.5-flash  → copilot function calling (chat with tools)

Critical rules:
  - Always use response_mime_type="application/json" for structured output
  - All calls have retry with exponential backoff (max 2 retries)
  - Never send citizen PII (name, phone, email) — only complaint text & category
  - Log all interactions for audit trail
"""

import asyncio
import json
import logging
from typing import Any

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Async wrapper around the Google Gemini generative AI SDK."""

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set - Gemini calls will fail")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # Primary high-speed model with fallback support
        self.primary_model_name = "gemini-3.5-flash-lite"
        self.fallback_model_name = "gemini-3.6-flash"
        self.flash_model = genai.GenerativeModel(self.primary_model_name)
        self.flash25_model = genai.GenerativeModel("gemini-3.5-flash-lite")


    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze_text(
        self,
        text: str,
        system_prompt: str,
        response_schema: dict,
    ) -> dict:
        """
        Send text to Gemini Flash with structured JSON output.

        Uses response_mime_type="application/json" and response_schema to
        force the model to return valid JSON matching the schema.

        Args:
            text:            The user-facing text (complaint text, etc.)
            system_prompt:   The full system/analysis prompt (with text embedded)
            response_schema: JSON Schema dict describing expected output

        Returns:
            Validated JSON dict matching the schema.

        Raises:
            Exception: After max_retries exhausted.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or whitespace only")

        async def _call():
            generation_config = GenerationConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.2,
            )
            try:
                response = await asyncio.to_thread(
                    self.flash_model.generate_content,
                    system_prompt,
                    generation_config=generation_config,
                )
                return self._parse_json_response(response)
            except Exception as e:
                # If model not found or unavailable, try fallback model
                if "404" in str(e) or "not found" in str(e).lower():
                    logger.info("Attempting fallback model: %s", self.fallback_model_name)
                    fallback_model = genai.GenerativeModel(self.fallback_model_name)
                    response = await asyncio.to_thread(
                        fallback_model.generate_content,
                        system_prompt,
                        generation_config=generation_config,
                    )
                    return self._parse_json_response(response)
                raise

        return await self._call_with_retry(_call, max_retries=2)

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        response_schema: dict | None = None,
    ) -> dict:
        """
        Send image + text prompt to Gemini (multimodal).

        Args:
            image_bytes:     Raw bytes of the image file.
            mime_type:       MIME type string (e.g. "image/jpeg", "image/png").
            prompt:          Analysis prompt (should describe what to look for).
            response_schema: Optional JSON Schema dict describing expected output.

        Returns:
            Structured JSON analysis dict.
        """
        image_part = {"mime_type": mime_type, "data": image_bytes}

        async def _call():
            config_kwargs = {
                "response_mime_type": "application/json",
                "temperature": 0.2,
            }
            if response_schema:
                config_kwargs["response_schema"] = response_schema

            generation_config = GenerationConfig(**config_kwargs)
            response = await asyncio.to_thread(
                self.flash_model.generate_content,
                [prompt, image_part],
                generation_config=generation_config,
            )
            return self._parse_json_response(response)

        return await self._call_with_retry(_call, max_retries=2)


    async def chat_with_tools(
        self,
        messages: list[dict],
        tools: list[dict],
        system_prompt: str,
    ) -> dict:
        """
        Send conversation to Gemini 2.5 Flash with function calling.

        Args:
            messages:      List of {"role": "user"|"model", "content": str} dicts.
            tools:         List of tool definition dicts (see ai/tools.py).
            system_prompt: System instruction for the copilot.

        Returns:
            {
                "response_text": str | None,
                "tool_calls": [{"name": str, "args": dict}] | []
            }
        """

        # Convert tool definitions to Gemini function declarations
        function_declarations = []
        for tool in tools:
            function_declarations.append({
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            })

        # Build the model with tools and system instruction
        model = genai.GenerativeModel(
            "gemini-3.5-flash-lite",
            tools=[{"function_declarations": function_declarations}],
            system_instruction=system_prompt,
        )

        # Convert messages to Gemini content format
        contents = []
        for msg in messages:
            contents.append({
                "role": msg["role"] if msg["role"] != "assistant" else "model",
                "parts": [{"text": msg["content"]}],
            })

        async def _call():
            response = await asyncio.to_thread(
                model.generate_content,
                contents,
            )
            return self._parse_tool_response(response)

        return await self._call_with_retry(_call, max_retries=2)

    async def get_embedding(self, text: str) -> list[float]:
        """
        Get text embedding using Gemini embedding model.

        Model: models/text-embedding-004
        Used when EMBEDDING_PROVIDER=gemini.

        Args:
            text: The text to embed.

        Returns:
            List of floats (embedding vector).
        """

        async def _call():
            result = await asyncio.to_thread(
                genai.embed_content,
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",
            )
            return result["embedding"]

        return await self._call_with_retry(_call, max_retries=2)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _call_with_retry(self, func, max_retries: int = 1) -> Any:
        """Retry wrapper with exponential backoff and fast failover on quota/auth errors."""
        for attempt in range(max_retries + 1):
            try:
                result = await func()
                logger.debug(
                    "Gemini API call succeeded on attempt %d", attempt + 1
                )
                return result
            except Exception as e:
                err_msg = str(e).lower()
                logger.warning(
                    "Gemini API error (attempt %d/%d): %s",
                    attempt + 1,
                    max_retries + 1,
                    e,
                )
                # Fail over immediately to fallback provider on quota, rate limit, or model not found
                if "429" in err_msg or "quota" in err_msg or "rate" in err_msg or "404" in err_msg or "not found" in err_msg:
                    raise
                if attempt < max_retries:
                    await asyncio.sleep(0.5)
                else:
                    raise

    @staticmethod
    def _parse_json_response(response) -> dict:
        """Extract and parse JSON from a Gemini response."""
        text = response.text.strip()

        # Handle markdown-wrapped JSON (```json ... ```)
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines (``` markers)
            text = "\n".join(lines[1:-1]).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse Gemini JSON response: %s", e)
            logger.debug("Raw response text: %s", text[:500])
            raise ValueError(f"Gemini returned invalid JSON: {e}") from e

    @staticmethod
    def _parse_tool_response(response) -> dict:
        """Parse a Gemini response that may contain function calls."""
        result: dict[str, Any] = {
            "response_text": None,
            "tool_calls": [],
        }

        for candidate in response.candidates:
            for part in candidate.content.parts:
                # Check for function call
                if hasattr(part, "function_call") and part.function_call:
                    fc = part.function_call
                    result["tool_calls"].append({
                        "name": fc.name,
                        "args": dict(fc.args) if fc.args else {},
                    })
                # Check for text content
                elif hasattr(part, "text") and part.text:
                    result["response_text"] = part.text

        return result
