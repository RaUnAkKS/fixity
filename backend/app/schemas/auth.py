from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# ── Registration ──


class UserRegister(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=1)
    phone: str | None = None
    role: str = Field(default="citizen", pattern="^(citizen|officer|admin)$")
    preferred_language: str = "en"


# ── Login ──


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


# ── Responses ──


class UserResponse(BaseModel):
    """Public user info returned in responses."""

    id: UUID
    email: str
    full_name: str
    role: str
    preferred_language: str

    model_config = {"from_attributes": True}


class UserDetailResponse(UserResponse):
    """Extended user info for /me endpoint."""

    phone: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Response from login endpoint."""

    token: str
    user: UserResponse


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = None
    phone: str | None = None
    preferred_language: str | None = None
