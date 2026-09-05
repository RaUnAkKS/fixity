# PROMPT FOR PERSON A — BACKEND ENGINEER

## Instructions for Antigravity

You are the **Backend Engineer** for CivicAI — an AI-Powered Civic Decision Intelligence Platform being built in a **24-hour hackathon** by a team of 3.

**IMPORTANT:** Before doing anything, read the file `SHARED_PROJECT_CONTEXT.md` in the workspace root. It contains the full project spec, database schema, API contracts, and architecture that ALL team members share.

---

## YOUR ROLE

You own the **entire backend** EXCEPT the AI/ML integration files. You build:
- FastAPI application setup and configuration
- All SQLAlchemy database models
- All Pydantic request/response schemas
- All API route handlers (except `api/copilot.py` and `api/voice.py`)
- Core services: auth, complaints, priority scoring, projects, verification, impact, geocoding
- Security (JWT, password hashing, RBAC)
- Database migrations (Alembic)
- Seed data
- CORS, error handling, middleware

---

## FILES YOU OWN (only modify these)

```
backend/
├── app/
│   ├── __init__.py              ✅ YOU
│   ├── main.py                  ✅ YOU
│   ├── config.py                ✅ YOU
│   ├── database.py              ✅ YOU
│   ├── models/*.py              ✅ ALL YOURS
│   ├── schemas/*.py             ✅ ALL YOURS (Person C will add analysis.py, copilot.py)
│   ├── api/deps.py              ✅ YOU
│   ├── api/auth.py              ✅ YOU
│   ├── api/complaints.py        ✅ YOU
│   ├── api/clusters.py          ✅ YOU
│   ├── api/priority.py          ✅ YOU
│   ├── api/projects.py          ✅ YOU
│   ├── api/verification.py      ✅ YOU
│   ├── api/impact.py            ✅ YOU
│   ├── api/dashboard.py         ✅ YOU
│   ├── api/admin.py             ✅ YOU
│   ├── services/auth_service.py         ✅ YOU
│   ├── services/complaint_service.py    ✅ YOU
│   ├── services/priority_service.py     ✅ YOU
│   ├── services/project_service.py      ✅ YOU
│   ├── services/verification_service.py ✅ YOU
│   ├── services/impact_service.py       ✅ YOU
│   ├── services/geocoding_service.py    ✅ YOU
│   ├── core/security.py         ✅ YOU
│   ├── core/exceptions.py       ✅ YOU
│   ├── core/scoring.py          ✅ YOU
│   └── seed/*                   ✅ YOU
├── alembic/                     ✅ YOU
├── requirements.txt             ✅ YOU
├── alembic.ini                  ✅ YOU
└── .env.example                 ✅ YOU
```

## FILES YOU DO NOT TOUCH

```
backend/app/ai/*                 ❌ Person C
backend/app/services/analysis_service.py    ❌ Person C
backend/app/services/speech_service.py      ❌ Person C
backend/app/services/image_service.py       ❌ Person C
backend/app/services/cluster_service.py     ❌ Person C
backend/app/services/copilot_service.py     ❌ Person C
backend/app/services/simulation_service.py  ❌ Person C
backend/app/services/embedding_service.py   ❌ Person C
backend/app/api/copilot.py       ❌ Person C
backend/app/api/voice.py         ❌ Person C
backend/app/schemas/analysis.py  ❌ Person C
backend/app/schemas/copilot.py   ❌ Person C
frontend/*                       ❌ Person B
```

---

## WHAT TO BUILD — PHASE BY PHASE

### Phase 1: Foundation (Hours 0-8) — YOUR CRITICAL PATH

**Hour 0-1: Project Setup**
1. Initialize the `backend/` directory
2. Create `requirements.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
psycopg2-binary==2.9.9
geoalchemy2==0.14.2
alembic==1.13.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
httpx==0.25.2
aiofiles==23.2.1
```
3. Create `app/config.py` — load all env vars using pydantic-settings
4. Create `app/database.py` — async engine + session factory for Neon PostgreSQL
5. Create `app/main.py` — FastAPI app with CORS, routers, startup/shutdown
6. Create `.env.example`
7. Set up Alembic (`alembic init alembic`, configure `env.py` for async)

**Hour 1-2: Auth**
1. Create `models/user.py` — User SQLAlchemy model (see DDL in shared context)
2. Create `schemas/auth.py`:
```python
class UserRegister(BaseModel):
    email: EmailStr
    password: str  # min 8 chars
    full_name: str
    phone: str | None = None
    role: str = "citizen"  # citizen, officer, admin
    preferred_language: str = "en"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    preferred_language: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse
```
3. Create `core/security.py` — JWT encode/decode, password hash/verify
4. Create `api/deps.py` — `get_current_user` dependency, `require_role` dependency
5. Create `services/auth_service.py` — register, login, get_user
6. Create `api/auth.py` — POST /register, POST /login, GET /me, PUT /me
7. **TEST**: Register a user, login, access /me

**Hour 2-3: Complaint Model + CRUD**
1. Create `models/complaint.py` — Complaint + status enum
2. Create `models/evidence.py` — ComplaintEvidence
3. Create `schemas/complaint.py`:
```python
class ComplaintCreate(BaseModel):
    original_text: str
    latitude: float
    longitude: float
    language: str | None = None
    category: str | None = None

class ComplaintResponse(BaseModel):
    id: UUID
    citizen_id: UUID
    original_text: str
    translated_text: str | None
    detected_language: str | None
    category: str | None
    subcategory: str | None
    ai_description: str | None
    latitude: float
    longitude: float
    address: str | None
    ward_id: int | None
    severity: int | None
    status: str
    department_id: int | None
    cluster_id: UUID | None
    ai_analysis: dict | None
    created_at: datetime
    updated_at: datetime

class ComplaintListResponse(BaseModel):
    items: list[ComplaintResponse]
    total: int
    page: int
    pages: int

class ComplaintDetail(ComplaintResponse):
    evidence: list[EvidenceResponse]
    analysis: dict | None  # AnalysisResponse from Person C
    cluster: ClusterSummary | None
    verifications: list[VerificationResponse]

class EvidenceResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    evidence_type: str
    file_url: str | None
    mime_type: str | None
    ai_analysis: dict | None
    created_at: datetime

class StatusUpdate(BaseModel):
    status: str  # validate against allowed transitions
```
4. Create `services/complaint_service.py` — create, list, get, update_status, upload_evidence
5. Create `api/complaints.py` — all complaint endpoints
6. Create `services/geocoding_service.py` — Nominatim reverse geocoding with caching

**Hour 3-4: File Upload**
1. Add file upload to evidence endpoint (photos and audio)
2. Validate file type (JPEG, PNG, WAV, MP3, WebM, OGG) and size (≤5MB)
3. Save to `uploads/photos/` and `uploads/audio/`
4. Return file URL path

**Hour 4-5: Wire Analysis Endpoint**
1. Create `api/complaints.py` endpoint `POST /api/complaints/{id}/analyze`
2. This endpoint calls `analysis_service.analyze_complaint()` (Person C implements this)
3. For now, create a **stub** that returns mock analysis data so Person B can integrate
4. When Person C's code is ready, the stub is replaced

**Stub example:**
```python
# In complaint_service.py — temporary until Person C integrates
async def analyze_complaint_stub(complaint_id: UUID):
    return {
        "detected_language": "hi",
        "translated_text": "The road in our area is very bad",
        "category": "Road Infrastructure",
        "severity": 75,
        "issues": ["road damage"],
        "suggested_department": "Public Works",
        "confidence": 0.85
    }
```

**Hour 5-6: Complaint Listing + Filters**
1. GET /api/complaints with query filters (ward_id, category, status, severity range, pagination)
2. GET /api/complaints/{id} with full detail (joins evidence, analysis)
3. GET /api/complaints/my — citizen's own complaints
4. PATCH /api/complaints/{id}/status — officer status update + audit log

**Hour 6-7: Dashboard + Departments**
1. Create `models/audit.py` — AuditLog model
2. Create `seed/departments.json` with 13 departments
3. Create `seed/seed_data.py` — seed departments, create sample wards (without fixed boundaries — wards are created dynamically based on complaints)
4. Create `api/dashboard.py` — GET /api/dashboard/summary (count queries)
5. Create `api/admin.py` — POST /api/admin/seed, GET /api/admin/users

**Hour 7-8: MERGE + TEST**
1. Run all endpoints manually via FastAPI docs (/docs)
2. Ensure auth works, complaints can be created with GPS coords, files upload
3. Merge to main branch
4. Announce to team: "Backend auth + complaint CRUD + file upload ready"

---

### Phase 2: Intelligence Layer (Hours 8-14)

**Hour 8-9: Priority Scoring Service**
1. Create `models/priority.py` — PriorityScore model
2. Create `core/scoring.py`:
```python
WEIGHTS = {
    "demand": 0.30,
    "severity": 0.25,
    "population": 0.20,
    "infrastructure": 0.15,
    "unresolved": 0.10,
}

async def calculate_priority(db, ward_id, category=None):
    # Query complaint counts, avg severity, ward population, etc.
    # Return deterministic score with breakdown
    ...
```
3. Create `schemas/priority.py`
4. Create `services/priority_service.py`

**Hour 9-10: Priority + Hotspot Endpoints**
1. Create `api/priority.py`:
   - GET /api/priority-areas — ranked list
   - GET /api/priority-areas/{ward_id} — detailed breakdown
   - GET /api/hotspots — returns `[{lat, lng, weight}]` for heatmap
   - POST /api/priority-areas/recalculate

**Hour 10-11: Cluster Endpoints**
1. Create `models/cluster.py` — ComplaintCluster model
2. Create `schemas/cluster.py`
3. Create `api/clusters.py`:
   - GET /api/clusters
   - GET /api/clusters/{id} — with underlying complaints
   - POST /api/clusters/refresh — calls Person C's cluster_service

**Hour 11-12: Ward/District + Spatial Queries**
1. Create `models/` — District, Ward models (already in DDL)
2. Implement ward assignment: when complaint has lat/lng, use `ST_Contains(ward.boundary, complaint.location)` to assign ward_id
3. If no ward boundary contains the point, assign to nearest ward or create a dynamic area

**Hour 12-13: Seed Demo Data**
1. Create realistic seed data:
   - 13 departments
   - Sample complaints (50-100) across different categories, severities, locations
   - At least 10 in Hindi
   - Some with clustered locations (to demonstrate heatmap hotspots)
2. The seed endpoint POST /api/admin/seed runs this

**Hour 13-14: MERGE + TEST**
1. Test priority scoring, hotspot data, cluster endpoints
2. Merge to main
3. Announce: "Priority scores, hotspots, clusters, seed data ready"

---

### Phase 3: Closed Loop (Hours 14-19)

**Hour 14-15: Projects**
1. Create `models/project.py` — Project model + project_complaints junction table
2. Create `schemas/project.py`
3. Create `services/project_service.py`
4. Create `api/projects.py`:
   - POST /api/projects (create, link complaints)
   - GET /api/projects, GET /api/projects/{id}
   - PATCH /api/projects/{id}/status
   - POST /api/projects/{id}/complete

**Hour 15-16: Complaint ↔ Project Linking**
1. When project status changes, propagate to linked complaints
2. Project "completed" → linked complaints become "resolved"
3. Status timeline events recorded in audit_log

**Hour 16-17: Verification + Impact**
1. Create `models/verification.py`, `models/impact.py`
2. Create `schemas/verification.py`, `schemas/impact.py`
3. Create `services/verification_service.py`:
   - Accept rating, comment, photo
   - Calculate verification_status: rating >= 4 → "matches", 3 → "partial", <=2 → "mismatch"
4. Create `services/impact_service.py`:
```python
async def calculate_impact(project_id):
    before = avg_severity_of_linked_complaints_at_creation(project_id)
    after = current_avg_severity_or_citizen_rating(project_id)
    ratings = avg_citizen_verification_ratings(project_id)
    trend = complaint_frequency_change(project_id)

    severity_improvement = (before - after) / before * 100 if before > 0 else 0
    rating_factor = (ratings / 5.0) * 100 if ratings else 50
    trend_factor = max(0, trend) * 100

    resolution_score = 0.40 * severity_improvement + 0.35 * rating_factor + 0.25 * trend_factor

    return {
        "before_severity": before,
        "after_severity": after,
        "resolution_score": min(100, max(0, round(resolution_score))),
        "confidence": "medium" if num_verifications >= 3 else "low",
        "factors": [...],
        "is_estimated": True
    }
```
5. Create `api/verification.py`, `api/impact.py`

**Hour 17-18: Dashboard Trends + Complaint Timeline**
1. GET /api/dashboard/trends — daily complaint counts, by-category breakdown
2. GET /api/complaints/{id}/timeline — ordered status events from audit_log
3. GET /api/impact/ward/{ward_id} — aggregate impact for a ward

**Hour 18-19: MERGE + TEST**
1. Test full flow: create complaint → create project → link → complete → verify → impact
2. Merge to main
3. Announce: "Closed loop complete — projects, verification, impact all working"

---

### Phase 4: Polish + Simulator (Hours 19-22)

**Hour 19-20: Simulation Endpoints (if time)**
1. POST /api/simulate/budget — given a budget, return ranked project options
2. POST /api/simulate/project-compare — compare project choices
3. Logic: rank by `impact_estimate / cost` (cost efficiency)

**Hour 20-21: Root Cause Endpoints (if time)**
1. GET /api/root-cause/{ward_id}/{category} — calls Person C's root cause service

**Hour 21-22: Admin + Final Fixes**
1. GET /api/admin/stats — system stats
2. Fix any broken endpoints
3. Add comprehensive seed data for demo
4. Ensure all error responses are clean JSON with proper HTTP status codes

---

### Phase 5: Deploy (Hours 22-24)

1. Deploy to Render (free tier)
2. Set environment variables on Render
3. Run Alembic migrations against Neon
4. Seed demo data on production
5. Test all endpoints on production URL
6. Announce production backend URL to Person B

---

## COORDINATION WITH TEAMMATES

### What Person B (Frontend) needs from you:
- Your endpoints working and documented at `/docs` (FastAPI auto-generates this)
- CORS configured to allow Person B's localhost:3000 and Vercel URL
- Consistent JSON response shapes matching the API contract
- Auth endpoints working first (they need login before they can test anything)

### What Person C (AI) needs from you:
- Database models and schemas created so they can import them
- The `analyze` endpoint stub so they know the interface
- Access to the database session factory (`get_db` dependency)

### What you need from Person C:
- `analysis_service.analyze_complaint(complaint_id, db)` — replace your stub
- `cluster_service.refresh_clusters(db)` — clustering logic
- `copilot_service.query(query, db, user_id)` — copilot logic

### Merge Order:
1. YOU merge first (you define the models/schemas everything depends on)
2. Person C merges second (AI services that depend on your models)
3. Person B merges last (frontend that depends on backend APIs)

---

## CRITICAL RULES

1. **Never hardcode API keys** — always use config.py / env vars
2. **Every endpoint must have proper error handling** — try/except, HTTPException with clear messages
3. **Every file upload must validate** — file type, file size (≤5MB)
4. **Every officer action must be audit-logged**
5. **Passwords must be bcrypt hashed** — never store plaintext
6. **JWT tokens must expire** — set to 24 hours for hackathon
7. **SQL injection protection** — use SQLAlchemy ORM, never raw string interpolation
8. **CORS must be configured** from hour 0 — or Person B can't test
9. **Create stubs for Person C's services** — don't block Person B waiting for AI
10. **Keep the server runnable at all times** — incremental development, never break main
