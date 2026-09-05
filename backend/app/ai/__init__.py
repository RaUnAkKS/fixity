"""
CivicAI AI Module
=================
All AI/LLM integration code: Gemini client, Groq client, prompt templates,
output validation schemas, and copilot tool definitions.
"""

from app.ai.gemini_client import GeminiClient
from app.ai.groq_client import GroqClient

__all__ = ["GeminiClient", "GroqClient"]
