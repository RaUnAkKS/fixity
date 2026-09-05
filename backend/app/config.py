<<<<<<< HEAD
"""
Application configuration — loaded from environment variables.
NOTE: This file is owned by Person A (Backend Engineer).
Person C only reads from it. This minimal version exists so AI code can
import settings before Person A's full config is ready.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DATABASE_URL_SYNC: str = os.getenv("DATABASE_URL_SYNC", "")

    # Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))

    # AI APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Embedding
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")

    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "5"))

    # Geocoding
    NOMINATIM_USER_AGENT: str = os.getenv("NOMINATIM_USER_AGENT", "civicai-hackathon")

    # Frontend URL (CORS)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")


settings = Settings()
=======
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://localhost/civicai"
    DATABASE_URL_SYNC: str = "postgresql://localhost/civicai"

    # Auth
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # AI APIs
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Embedding
    EMBEDDING_PROVIDER: str = "local"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 5

    # Geocoding
    NOMINATIM_USER_AGENT: str = "civicai-hackathon"

    # Frontend URL (CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
>>>>>>> bf3f0a66ccba0392bab80165f086f14760ec3070
