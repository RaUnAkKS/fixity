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
    ReputationBreakdownResponse,
)
from app.services import auth_service
from app.services.reputation_service import ReputationService

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


@router.get("/reputation", response_model=ReputationBreakdownResponse)
async def get_my_reputation(current_user: User = Depends(get_current_user)):
    """Get authenticated citizen's civic reputation breakdown and tier status."""
    return ReputationService.get_reputation_detail(current_user)


@router.post("/setup-demo-accounts")
async def setup_demo_accounts(db: AsyncSession = Depends(get_db)):
    """Ensure standard demo accounts and promoter roles exist."""
    import asyncio
    from sqlalchemy import select
    from app.core.security import hash_password
    
    # Pre-hash once in worker thread
    demo123_hash = await asyncio.to_thread(hash_password, "demo123")
    
    accounts = [
        ("officer@fixity.demo", demo123_hash, "Municipal Officer (Fixity)", "officer"),
        ("admin@fixity.demo", demo123_hash, "System Administrator (Fixity)", "admin"),
        ("citizen@fixity.demo", demo123_hash, "Demo Citizen (Fixity)", "citizen"),
    ]
    
    for email, pwd_hash, name, role in accounts:
        res = await db.execute(select(User).where(User.email == email))
        u = res.scalar_one_or_none()
        if u:
            u.password_hash = pwd_hash
            u.role = role
            u.full_name = name
        else:
            new_u = User(
                email=email,
                password_hash=pwd_hash,
                full_name=name,
                role=role,
                preferred_language="en"
            )
            db.add(new_u)

    # Set personal test accounts to citizen role
    for special_email in ["raunak@gmail.com", "rehan.2006ktm@gmail.com"]:
        res = await db.execute(select(User).where(User.email == special_email))
        u = res.scalar_one_or_none()
        if u:
            u.role = "citizen"
            
    await db.commit()
    return {"status": "success", "message": "Demo accounts initialized with clear Citizen / Officer separation."}


@router.post("/switch-role")
async def switch_role(
    role_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow quick role switching for testing between citizen and officer."""
    from app.core.security import create_access_token
    new_role = role_data.get("role")
    if new_role not in ("citizen", "officer", "admin"):
        new_role = "officer" if current_user.role == "citizen" else "citizen"
    
    current_user.role = new_role
    await db.commit()
    await db.refresh(current_user)
    
    token = create_access_token(current_user.id, current_user.role)
    return {
        "status": "success",
        "role": current_user.role,
        "token": token,
        "user": UserResponse.model_validate(current_user),
    }


