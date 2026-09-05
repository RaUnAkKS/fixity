# CivicAI Backend

AI-Powered Civic Decision Intelligence Platform — Backend API

## Tech Stack

- **Framework**: FastAPI 0.104
- **ORM**: SQLAlchemy 2.0 (async) + GeoAlchemy2
- **Database**: PostgreSQL 15 + PostGIS (Neon)
- **Auth**: JWT (python-jose + bcrypt)
- **Migrations**: Alembic

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file and fill in values
copy .env.example .env
# Edit .env with your Neon database URL and API keys

# 4. Run migrations
alembic upgrade head

# 5. Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. Seed demo data (after server is running)
# POST http://localhost:8000/api/admin/seed (requires admin auth)
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@civicai.demo | admin123456 | admin |
| officer@civicai.demo | officer123456 | officer |
| citizen@civicai.demo | citizen123456 | citizen |

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app + CORS + routers
│   ├── config.py        # Pydantic settings
│   ├── database.py      # Async SQLAlchemy engine
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response schemas
│   ├── api/             # Route handlers
│   ├── services/        # Business logic
│   ├── core/            # Security, exceptions, scoring
│   └── seed/            # Seed data
├── alembic/             # Database migrations
├── uploads/             # File uploads (photos, audio)
├── requirements.txt
└── .env.example
```
