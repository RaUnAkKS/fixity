import json
import os
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import Department, District, Ward
from app.models.user import User
from app.core.security import hash_password


SEED_DIR = Path(__file__).parent


async def seed_departments(db: AsyncSession) -> int:
    """Seed departments from JSON file. Returns count of departments seeded."""
    json_path = SEED_DIR / "departments.json"
    with open(json_path, "r") as f:
        departments_data = json.load(f)

    count = 0
    for dept_data in departments_data:
        # Check if already exists
        result = await db.execute(
            select(Department).where(Department.name == dept_data["name"])
        )
        if result.scalar_one_or_none() is None:
            dept = Department(
                name=dept_data["name"],
                description=dept_data["description"],
            )
            db.add(dept)
            count += 1

    await db.flush()
    return count


async def seed_districts_and_wards(db: AsyncSession) -> dict:
    """Seed sample districts and wards for demo purposes.

    Wards are created without fixed boundaries — they can be assigned
    dynamically based on complaint locations.
    """
    # Sample districts
    districts_data = [
        {"name": "Central District"},
        {"name": "North District"},
        {"name": "South District"},
        {"name": "East District"},
        {"name": "West District"},
    ]

    district_ids = {}
    for d in districts_data:
        result = await db.execute(
            select(District).where(District.name == d["name"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            district_ids[d["name"]] = existing.id
        else:
            district = District(name=d["name"])
            db.add(district)
            await db.flush()
            await db.refresh(district)
            district_ids[d["name"]] = district.id

    # Sample wards (at least 2 per district)
    wards_data = [
        {"name": "Ward 1 - City Center", "district": "Central District", "population": 50000, "infra": 0.7},
        {"name": "Ward 2 - Old Town", "district": "Central District", "population": 35000, "infra": 0.4},
        {"name": "Ward 3 - Railway Colony", "district": "North District", "population": 42000, "infra": 0.5},
        {"name": "Ward 4 - Industrial Area", "district": "North District", "population": 28000, "infra": 0.6},
        {"name": "Ward 5 - Lakeside", "district": "South District", "population": 38000, "infra": 0.55},
        {"name": "Ward 6 - Garden Colony", "district": "South District", "population": 31000, "infra": 0.65},
        {"name": "Ward 7 - Market Area", "district": "East District", "population": 45000, "infra": 0.45},
        {"name": "Ward 8 - University Zone", "district": "East District", "population": 55000, "infra": 0.7},
        {"name": "Ward 9 - Slum Rehabilitation", "district": "West District", "population": 60000, "infra": 0.25},
        {"name": "Ward 10 - New Township", "district": "West District", "population": 22000, "infra": 0.8},
    ]

    ward_count = 0
    for w in wards_data:
        result = await db.execute(select(Ward).where(Ward.name == w["name"]))
        if result.scalar_one_or_none() is None:
            ward = Ward(
                name=w["name"],
                district_id=district_ids[w["district"]],
                population=w["population"],
                infrastructure_score=w["infra"],
            )
            db.add(ward)
            ward_count += 1

    await db.flush()
    return {"districts": len(districts_data), "wards": ward_count}


async def seed_admin_user(db: AsyncSession) -> bool:
    """Seed a default admin user for demo purposes."""
    result = await db.execute(
        select(User).where(User.email == "admin@civicai.demo")
    )
    if result.scalar_one_or_none():
        return False

    admin = User(
        email="admin@civicai.demo",
        password_hash=hash_password("admin123456"),
        full_name="CivicAI Admin",
        role="admin",
        preferred_language="en",
    )
    db.add(admin)

    # Also create a sample officer
    officer_result = await db.execute(
        select(User).where(User.email == "officer@civicai.demo")
    )
    if officer_result.scalar_one_or_none() is None:
        officer = User(
            email="officer@civicai.demo",
            password_hash=hash_password("officer123456"),
            full_name="Demo Officer",
            role="officer",
            preferred_language="en",
        )
        db.add(officer)

    # Create a sample citizen
    citizen_result = await db.execute(
        select(User).where(User.email == "citizen@civicai.demo")
    )
    if citizen_result.scalar_one_or_none() is None:
        citizen = User(
            email="citizen@civicai.demo",
            password_hash=hash_password("citizen123456"),
            full_name="Demo Citizen",
            phone="+91-9876543210",
            role="citizen",
            preferred_language="hi",
        )
        db.add(citizen)

    await db.flush()
    return True


async def run_all_seeds(db: AsyncSession) -> dict:
    """Run all seed functions and return summary."""
    dept_count = await seed_departments(db)
    geo_result = await seed_districts_and_wards(db)
    users_seeded = await seed_admin_user(db)

    return {
        "departments": dept_count,
        "districts": geo_result["districts"],
        "wards": geo_result["wards"],
        "users": 3 if users_seeded else 0,
    }
