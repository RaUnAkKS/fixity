from functools import lru_cache
from pydantic_settings import BaseSettings


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


# Singleton settings instance for direct import
settings = get_settings()
