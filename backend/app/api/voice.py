"""
Voice / Speech API Endpoints
============================
POST /api/voice/transcribe: Transcribes audio file into text with language detection.
"""

import logging
from typing import Any
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.services.speech_service import SpeechService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])

ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/flac",
    "application/octet-stream",  # Fallback for some browsers recording raw blob
}

MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB Groq limit


@router.post(
    "/transcribe",
    summary="Transcribe spoken complaint audio",
    response_description="Transcribed text with detected language and confidence score",
)
async def transcribe_audio(
    audio_file: UploadFile = File(..., description="Audio recording file (mp3, wav, m4a, webm, ogg)"),
    language: str | None = Form(None, description="Optional ISO 639-1 language hint (e.g. 'hi', 'en', 'bn')"),
) -> dict[str, Any]:
    """
    Transcribe a citizen's voice recording into text.

    - Validates file type and size.
    - Sends to Groq Whisper large-v3-turbo.
    - Returns transcribed text, detected language code, and confidence metric.
    """
    if audio_file.content_type and audio_file.content_type not in ALLOWED_AUDIO_TYPES:
        # Check filename extension as secondary validation
        filename_lower = (audio_file.filename or "").lower()
        valid_extensions = (".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac", ".flac", ".mp4")
        if not any(filename_lower.endswith(ext) for ext in valid_extensions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported audio format: {audio_file.content_type}. Supported: mp3, wav, m4a, ogg, webm, aac, flac",
            )

    audio_bytes = await audio_file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is empty",
        )

    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file exceeds maximum size limit of 25MB",
        )

    speech_service = SpeechService()
    try:
        filename = audio_file.filename or "recording.wav"
        result = await speech_service.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            language=language,
        )
        return result
    except Exception as e:
        logger.error("Error during voice transcription endpoint execution: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )
