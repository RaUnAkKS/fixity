from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.database import init_db
from app.api.auth import router as auth_router
from app.api.complaints import router as complaints_router
from app.api.dashboard import router as dashboard_router
from app.api.admin import router as admin_router
from app.api.voice import router as voice_router
from app.api.copilot import router as copilot_router

settings = get_settings()


# Ensure upload directories exist
os.makedirs(os.path.join(settings.UPLOAD_DIR, "photos"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "audio"), exist_ok=True)


@asynccontextmanager
async def lifespan(app_: FastAPI):
    """Startup and shutdown events."""
    # Startup
    import app.models  # noqa: F401 - Register all models with Base.metadata
    import asyncio
    try:
        await asyncio.wait_for(init_db(), timeout=6.0)
    except Exception as e:
        print(f"Notice: init_db completed or skipped: {e}")
    yield
    # Shutdown
    pass


app = FastAPI(
    title="CivicAI",
    description="AI-Powered Civic Decision Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Static file serving for evidence photos & audio
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# CORS — allow frontend origins (production Vercel, previews, and local development)
raw_origins = [orig.strip().rstrip("/") for orig in settings.FRONTEND_URL.split(",") if orig.strip()]
default_origins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
allowed_origins = list(dict.fromkeys(raw_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(voice_router)
app.include_router(copilot_router)


@app.get("/")
async def root():
    return {
        "name": "CivicAI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
