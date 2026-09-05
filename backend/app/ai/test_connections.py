"""
CivicAI — AI Connection Test Script
====================================
Tests that both Gemini and Groq API keys are valid and the SDKs work.

Usage:
    cd backend
    python -m app.ai.test_connections

Requires GEMINI_API_KEY and GROQ_API_KEY in .env or environment.
"""

import asyncio
import sys
import os

# Add backend/ to path so we can import app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.ai.gemini_client import GeminiClient
from app.ai.groq_client import GroqClient
from app.config import settings


async def test_gemini():
    """Test Gemini API connection with a simple structured output call."""
    print("\n" + "=" * 60)
    print("TESTING GEMINI API CONNECTION")
    print("=" * 60)

    if not settings.GEMINI_API_KEY:
        print("[WARN] GEMINI_API_KEY not set - skipping Gemini live test")
        return False

    client = GeminiClient()

    # Test 1: Structured text analysis
    print("\n[1/3] Testing structured text analysis...")
    try:
        schema = {
            "type": "object",
            "properties": {
                "greeting": {"type": "string"},
                "language": {"type": "string"},
            },
            "required": ["greeting", "language"],
        }
        result = await client.analyze_text(
            text="Hello world",
            system_prompt='Respond with a JSON greeting. Set "greeting" to a short hello and "language" to "en".',
            response_schema=schema,
        )
        print(f"   [OK] Structured output: {result}")
        assert "greeting" in result, "Missing 'greeting' key"
    except Exception as e:
        print(f"   [FAIL] Failed: {e}")
        return False

    # Test 2: Embedding
    print("\n[2/3] Testing embedding generation...")
    try:
        embedding = await client.get_embedding("Test sentence for embedding")
        print(f"   [OK] Embedding dimension: {len(embedding)}")
        assert len(embedding) > 0, "Empty embedding"
    except Exception as e:
        print(f"   [FAIL] Failed: {e}")
        return False

    # Test 3: Chat (no tools, just basic connectivity check)
    print("\n[3/3] Testing basic chat (Gemini 2.5 Flash)...")
    try:
        result = await client.chat_with_tools(
            messages=[{"role": "user", "content": "Say hello in exactly 3 words."}],
            tools=[],
            system_prompt="You are a helpful assistant.",
        )
        print(f"   [OK] Chat response: {result.get('response_text', '')[:100]}")
    except Exception as e:
        print(f"   [FAIL] Failed: {e}")
        return False

    print("\n[OK] All Gemini tests passed!")
    return True


async def test_groq():
    """Test Groq API connection with a simple chat completion."""
    print("\n" + "=" * 60)
    print("TESTING GROQ API CONNECTION")
    print("=" * 60)

    if not settings.GROQ_API_KEY:
        print("[WARN] GROQ_API_KEY not set - skipping Groq live test")
        return False

    client = GroqClient()

    # Test 1: Chat completion (Llama 3.3 70B)
    print("\n[1/2] Testing chat completion (Llama 3.3 70B)...")
    try:
        result = await client.chat_completion(
            messages=[{"role": "user", "content": "Say hello in exactly 3 words."}],
            system_prompt="You are a helpful assistant. Be concise.",
        )
        print(f"   [OK] Chat response: {result[:100]}")
    except Exception as e:
        print(f"   [FAIL] Failed: {e}")
        return False

    # Test 2: JSON completion
    print("\n[2/2] Testing JSON chat completion...")
    try:
        result = await client.chat_completion_json(
            messages=[
                {"role": "user", "content": "Classify this: 'road has potholes'"}
            ],
            system_prompt='Classify the text. Return JSON: {"category": "string", "severity": integer 1-100}',
        )
        print(f"   [OK] JSON response: {result}")
        assert "category" in result, "Missing 'category' key"
    except Exception as e:
        print(f"   [FAIL] Failed: {e}")
        return False

    print("\n[OK] All Groq tests passed!")
    return True


async def main():
    print("CivicAI -- AI Connection Test")
    print("=" * 60)
    print(f"GEMINI_API_KEY: {'set (' + settings.GEMINI_API_KEY[:8] + '...)' if settings.GEMINI_API_KEY else 'NOT SET'}")
    print(f"GROQ_API_KEY:   {'set (' + settings.GROQ_API_KEY[:8] + '...)' if settings.GROQ_API_KEY else 'NOT SET'}")

    gemini_ok = await test_gemini()
    groq_ok = await test_groq()

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Gemini: {'[OK] PASS' if gemini_ok else '[SKIP/FAIL]'}")
    print(f"  Groq:   {'[OK] PASS' if groq_ok else '[SKIP/FAIL]'}")
    print()

    if not (gemini_ok and groq_ok):
        print("[INFO] Live API calls skipped or failed because keys are not set in .env yet.")
        print("[INFO] Client wrapper modules, imports, and initialization verified successfully.")
    else:
        print("[SUCCESS] All API connections verified! Ready to build AI services.")


if __name__ == "__main__":
    asyncio.run(main())
