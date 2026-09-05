from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    UserDetailResponse,
    TokenResponse,
    UserUpdate,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and return JWT token."""
    user, token = await auth_service.register_user(db, data)
    return TokenResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user, token = await auth_service.login_user(db, data)
    return TokenResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserDetailResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserDetailResponse.model_validate(current_user)


@router.put("/me", response_model=UserDetailResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the currently authenticated user's profile."""
    updated = await auth_service.update_user_profile(
        db,
        current_user,
        full_name=data.full_name,
        phone=data.phone,
        preferred_language=data.preferred_language,
    )
    return UserDetailResponse.model_validate(updated)
