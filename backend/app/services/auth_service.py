from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictError, UnauthorizedError, NotFoundError
from app.schemas.auth import UserRegister, UserLogin


async def register_user(db: AsyncSession, data: UserRegister) -> tuple[User, str]:
    """Register a new user. Returns (user, token) or raises ConflictError."""
    # Check for existing email
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictError(detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
        preferred_language=data.preferred_language,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id, user.role)
    return user, token


async def login_user(db: AsyncSession, data: UserLogin) -> tuple[User, str]:
    """Authenticate a user by email/password. Returns (user, token) or raises."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise UnauthorizedError(detail="Invalid email or password")

    token = create_access_token(user.id, user.role)
    return user, token


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    """Fetch a user by ID or raise NotFoundError."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(detail="User not found")
    return user


async def update_user_profile(
    db: AsyncSession, user: User, full_name: str | None, phone: str | None, preferred_language: str | None
) -> User:
    """Update user profile fields."""
    if full_name is not None:
        user.full_name = full_name
    if phone is not None:
        user.phone = phone
    if preferred_language is not None:
        user.preferred_language = preferred_language
    await db.flush()
    await db.refresh(user)
    return user
