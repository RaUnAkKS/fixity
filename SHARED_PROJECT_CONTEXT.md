# CivicAI — Shared Project Context (ALL TEAM MEMBERS READ THIS)

## Project Overview

**CivicAI** is an AI-Powered Civic Decision Intelligence Platform for the HackQuest hackathon.
Tagline: "From Citizen Voice to Verified Impact"

It is a **closed-loop** system:
```
Citizen Voice → AI Understanding → Civic Intelligence → Priority Detection
→ Government Decision Support → Government Action → Citizen Verification
→ Impact Measurement
```

**This is NOT a complaint ticketing system.** It is a decision-intelligence platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Maps | Leaflet + react-leaflet + leaflet.heat + OpenStreetMap tiles |
| Backend | Python 3.11+, FastAPI |
| ORM | SQLAlchemy 2.0 + GeoAlchemy2 |
| Database | PostgreSQL 15 + PostGIS (hosted on Neon free tier) |
| Primary LLM | Google Gemini 2.0 Flash (structured JSON output) |
| Copilot LLM | Google Gemini 2.5 Flash (function calling) |
| Backup LLM | Groq Llama 3.3 70B |
| Speech-to-Text | Groq Whisper large-v3-turbo |
| Auth | JWT (python-jose + passlib/bcrypt) |
| File Storage | Local filesystem (dev), Supabase Storage (deploy) |
| Location | Browser Geolocation API (real GPS) + Nominatim reverse geocoding (cached) |

---

## Repository Structure

```
civicai/
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── complaint.py
│   │   │   ├── evidence.py
│   │   │   ├── cluster.py
│   │   │   ├── priority.py
│   │   │   ├── project.py
│   │   │   ├── verification.py
│   │   │   ├── impact.py
│   │   │   └── audit.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── complaint.py
│   │   │   ├── analysis.py
│   │   │   ├── cluster.py
│   │   │   ├── priority.py
│   │   │   ├── project.py
│   │   │   ├── verification.py
│   │   │   ├── impact.py
│   │   │   └── copilot.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   ├── auth.py
│   │   │   ├── complaints.py
│   │   │   ├── voice.py
│   │   │   ├── clusters.py
│   │   │   ├── priority.py
│   │   │   ├── projects.py
│   │   │   ├── verification.py
│   │   │   ├── impact.py
│   │   │   ├── copilot.py
│   │   │   ├── dashboard.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── complaint_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── speech_service.py
│   │   │   ├── image_service.py
│   │   │   ├── cluster_service.py
│   │   │   ├── priority_service.py
│   │   │   ├── project_service.py
│   │   │   ├── verification_service.py
│   │   │   ├── impact_service.py
│   │   │   ├── copilot_service.py
│   │   │   ├── simulation_service.py
│   │   │   ├── embedding_service.py
│   │   │   └── geocoding_service.py
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── gemini_client.py
│   │   │   ├── groq_client.py
│   │   │   ├── prompts.py
│   │   │   ├── schemas.py
│   │   │   └── tools.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py
│   │   │   ├── exceptions.py
│   │   │   └── scoring.py
│   │   └── seed/
│   │       ├── __init__.py
│   │       ├── seed_data.py
│   │       └── departments.json
│   ├── uploads/
│   │   ├── photos/
│   │   └── audio/
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic.ini
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── report/
│   │   │   │   ├── page.tsx
│   │   │   │   └── voice/page.tsx
│   │   │   ├── complaints/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── verify/page.tsx
│   │   │   │       └── impact/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── complaints/page.tsx
│   │   │   │   ├── clusters/page.tsx
│   │   │   │   ├── heatmap/page.tsx
│   │   │   │   ├── priorities/page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── copilot/page.tsx
│   │   │   │   ├── simulator/page.tsx
│   │   │   │   └── impact/page.tsx
│   │   │   └── admin/
│   │   │       ├── users/page.tsx
│   │   │       ├── categories/page.tsx
│   │   │       └── seed/page.tsx
│   │   ├── components/
│   │   │   ├── ui/          (shadcn/ui)
│   │   │   ├── layout/      (Navbar, Sidebar, Footer)
│   │   │   ├── complaints/  (Cards, forms, timeline)
│   │   │   ├── dashboard/   (Stats cards, charts)
│   │   │   ├── map/         (MapView, HeatmapLayer, WardPopup)
│   │   │   ├── copilot/     (Chat UI, tool-call display)
│   │   │   ├── verification/(Before/after view)
│   │   │   └── shared/      (Loading, error, file upload)
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useComplaints.ts
│   │       ├── useGeolocation.ts
│   │       └── useMap.ts
│   ├── public/
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## Database Schema (PostgreSQL + PostGIS DDL)

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'citizen',
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- ============================================================
-- DISTRICTS & WARDS
-- ============================================================
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    boundary GEOMETRY(POLYGON, 4326)
);

CREATE INDEX idx_districts_boundary ON districts USING GIST(boundary);

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district_id INTEGER REFERENCES districts(id),
    boundary GEOMETRY(POLYGON, 4326),
    population INTEGER DEFAULT 0,
    infrastructure_score FLOAT DEFAULT 0.5  -- 0.0 (worst) to 1.0 (best)
);

CREATE INDEX idx_wards_boundary ON wards USING GIST(boundary);
CREATE INDEX idx_wards_district ON wards(district_id);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TYPE complaint_status AS ENUM (
    'submitted', 'analyzing', 'analyzed', 'assigned',
    'in_progress', 'resolved', 'verified'
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL REFERENCES users(id),
    original_text TEXT NOT NULL,
    translated_text TEXT,
    detected_language VARCHAR(10),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    ai_description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOMETRY(POINT, 4326),
    address TEXT,
    ward_id INTEGER REFERENCES wards(id),
    district_id INTEGER REFERENCES districts(id),
    severity INTEGER CHECK (severity >= 1 AND severity <= 100),
    status complaint_status NOT NULL DEFAULT 'submitted',
    department_id INTEGER REFERENCES departments(id),
    cluster_id UUID,  -- FK added after cluster table
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX idx_complaints_ward ON complaints(ward_id);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_severity ON complaints(severity);
CREATE INDEX idx_complaints_location ON complaints USING GIST(location);
CREATE INDEX idx_complaints_created ON complaints(created_at);
CREATE INDEX idx_complaints_cluster ON complaints(cluster_id);

-- ============================================================
-- COMPLAINT EVIDENCE
-- ============================================================
CREATE TYPE evidence_type AS ENUM ('photo', 'audio', 'document');

CREATE TABLE complaint_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    evidence_type evidence_type NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_url VARCHAR(512),
    mime_type VARCHAR(100),
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evidence_complaint ON complaint_evidence(complaint_id);

-- ============================================================
-- COMPLAINT ANALYSIS
-- ============================================================
CREATE TABLE complaint_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    model_used VARCHAR(100),
    structured_output JSONB NOT NULL,
    extracted_issues JSONB,
    suggested_category VARCHAR(100),
    suggested_severity INTEGER,
    suggested_department VARCHAR(100),
    confidence FLOAT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analysis_complaint ON complaint_analysis(complaint_id);

-- ============================================================
-- COMPLAINT CLUSTERS
-- ============================================================
CREATE TABLE complaint_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    representative_text TEXT,
    category VARCHAR(100),
    ward_id INTEGER REFERENCES wards(id),
    complaint_count INTEGER DEFAULT 0,
    avg_severity FLOAT,
    centroid GEOMETRY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add FK from complaints
ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_cluster
    FOREIGN KEY (cluster_id) REFERENCES complaint_clusters(id);

-- ============================================================
-- PRIORITY SCORES
-- ============================================================
CREATE TABLE priority_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id INTEGER NOT NULL REFERENCES wards(id),
    category VARCHAR(100),
    demand_score FLOAT DEFAULT 0,
    severity_score FLOAT DEFAULT 0,
    population_score FLOAT DEFAULT 0,
    infrastructure_gap_score FLOAT DEFAULT 0,
    unresolved_score FLOAT DEFAULT 0,
    total_score FLOAT DEFAULT 0,
    explanation JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ward_id, category)
);

CREATE INDEX idx_priority_ward ON priority_scores(ward_id);
CREATE INDEX idx_priority_total ON priority_scores(total_score DESC);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TYPE project_status AS ENUM (
    'proposed', 'approved', 'in_progress', 'completed', 'cancelled'
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    ward_id INTEGER REFERENCES wards(id),
    department_id INTEGER REFERENCES departments(id),
    status project_status NOT NULL DEFAULT 'proposed',
    estimated_cost FLOAT,
    affected_population INTEGER,
    priority_score FLOAT,
    ai_recommendation JSONB,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_projects_ward ON projects(ward_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Link complaints to projects (many-to-many)
CREATE TABLE project_complaints (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, complaint_id)
);

-- ============================================================
-- CITIZEN VERIFICATION
-- ============================================================
CREATE TYPE verification_status AS ENUM ('matches', 'partial', 'mismatch');

CREATE TABLE citizen_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id),
    project_id UUID REFERENCES projects(id),
    citizen_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photo_path VARCHAR(512),
    audio_path VARCHAR(512),
    is_resolved BOOLEAN DEFAULT FALSE,
    verification_status verification_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_complaint ON citizen_verifications(complaint_id);
CREATE INDEX idx_verification_project ON citizen_verifications(project_id);

-- ============================================================
-- IMPACT MEASUREMENTS
-- ============================================================
CREATE TABLE impact_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    ward_id INTEGER REFERENCES wards(id),
    before_severity FLOAT,
    after_severity FLOAT,
    resolution_score FLOAT,
    confidence VARCHAR(20) DEFAULT 'low',
    factors JSONB,
    is_estimated BOOLEAN DEFAULT TRUE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_impact_project ON impact_measurements(project_id);

-- ============================================================
-- AI INTERACTIONS (Copilot audit log)
-- ============================================================
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    interaction_type VARCHAR(50),
    query TEXT NOT NULL,
    response TEXT,
    tool_calls JSONB,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

---

## API Contract (All Endpoints)

### Authentication

```
POST /api/auth/register
  Request:  { email, password, full_name, phone?, role?, preferred_language? }
  Response: { id, email, full_name, role, token }

POST /api/auth/login
  Request:  { email, password }
  Response: { token, user: { id, email, full_name, role, preferred_language } }

GET /api/auth/me
  Headers:  Authorization: Bearer <token>
  Response: { id, email, full_name, phone, role, preferred_language, created_at }

PUT /api/auth/me
  Headers:  Authorization: Bearer <token>
  Request:  { full_name?, phone?, preferred_language? }
  Response: { id, email, full_name, phone, role, preferred_language }
```

### Complaints

```
POST /api/complaints
  Auth:     Citizen
  Request:  { original_text, latitude, longitude, language?, category? }
  Response: { id, original_text, latitude, longitude, status: "submitted", created_at }

POST /api/complaints/{id}/evidence
  Auth:     Citizen (owner)
  Request:  multipart/form-data { file, evidence_type: "photo"|"audio"|"document" }
  Response: { id, complaint_id, evidence_type, file_url, ai_analysis? }

POST /api/complaints/{id}/analyze
  Auth:     System/Officer
  Response: {
    id, complaint_id, detected_language, translated_text,
    category, subcategory, severity, issues: string[],
    possible_related_issue, suggested_department, summary, confidence
  }

GET /api/complaints
  Auth:     Officer
  Query:    ?ward_id=&category=&status=&severity_min=&severity_max=&page=&limit=
  Response: { items: Complaint[], total, page, pages }

GET /api/complaints/{id}
  Auth:     JWT (citizen sees own, officer sees all)
  Response: {
    id, citizen_id, original_text, translated_text, detected_language,
    category, subcategory, ai_description, latitude, longitude, address,
    ward_id, district_id, severity, status, department_id, cluster_id,
    ai_analysis, created_at, updated_at,
    evidence: Evidence[], analysis: Analysis?, cluster: ClusterSummary?,
    verifications: Verification[]
  }

GET /api/complaints/{id}/timeline
  Auth:     JWT
  Response: { events: [{ status, timestamp, description, actor? }] }

PATCH /api/complaints/{id}/status
  Auth:     Officer
  Request:  { status: "assigned"|"in_progress"|"resolved" }
  Response: { id, status, updated_at }

GET /api/complaints/my
  Auth:     Citizen
  Query:    ?status=&page=&limit=
  Response: { items: Complaint[], total, page, pages }
```

### Voice

```
POST /api/voice/transcribe
  Auth:     Citizen
  Request:  multipart/form-data { audio_file, language?: "hi"|"en"|"bn"|... }
  Response: { text, detected_language, confidence }
```

### Clusters

```
GET /api/clusters
  Auth:     Officer
  Query:    ?category=&ward_id=&min_count=
  Response: { items: Cluster[] }
  Cluster:  { id, representative_text, category, ward_id, complaint_count, avg_severity, centroid }

GET /api/clusters/{id}
  Auth:     Officer
  Response: { ...Cluster, complaints: ComplaintSummary[] }

POST /api/clusters/refresh
  Auth:     Officer/Admin
  Response: { clusters_created: int, complaints_clustered: int }
```

### Priority & Heatmap

```
GET /api/priority-areas
  Auth:     Officer
  Query:    ?category=&limit=
  Response: { items: PriorityScore[] }
  PriorityScore: {
    id, ward_id, ward_name, category, total_score,
    demand_score, severity_score, population_score,
    infrastructure_gap_score, unresolved_score, explanation
  }

GET /api/priority-areas/{ward_id}
  Auth:     Officer
  Response: { ...PriorityScore, top_issues: string[], complaint_count, population }

GET /api/hotspots
  Auth:     Officer
  Response: { points: [{ lat, lng, weight }] }

POST /api/priority-areas/recalculate
  Auth:     Officer/Admin
  Response: { areas_calculated: int }
```

### Projects

```
POST /api/projects
  Auth:     Officer
  Request:  {
    title, description, category, ward_id, department_id,
    estimated_cost, affected_population, complaint_ids: UUID[]
  }
  Response: { id, title, status: "proposed", created_at }

GET /api/projects
  Auth:     Officer
  Query:    ?status=&ward_id=&page=&limit=
  Response: { items: Project[], total, page, pages }

GET /api/projects/{id}
  Auth:     Officer
  Response: {
    ...Project, complaints: ComplaintSummary[],
    verifications: Verification[], impact: ImpactMeasurement?
  }

PATCH /api/projects/{id}/status
  Auth:     Officer
  Request:  { status: "approved"|"in_progress"|"completed"|"cancelled" }
  Response: { id, status, updated_at }

POST /api/projects/{id}/complete
  Auth:     Officer
  Response: { id, status: "completed", completed_at, impact: ImpactMeasurement }
```

### Verification & Impact

```
POST /api/complaints/{id}/verify
  Auth:     Citizen (complaint owner)
  Request:  multipart/form-data { rating: 1-5, comment?, photo?, is_resolved: bool }
  Response: {
    id, complaint_id, rating, comment, is_resolved,
    verification_status: "matches"|"partial"|"mismatch"
  }

GET /api/impact/{project_id}
  Auth:     JWT
  Response: {
    project_id, before_severity, after_severity,
    resolution_score, confidence: "low"|"medium"|"high",
    factors: string[], is_estimated: true
  }

GET /api/impact/ward/{ward_id}
  Auth:     Officer
  Response: {
    ward_id, projects_completed, avg_resolution_score,
    verifications_count, citizen_satisfaction_avg
  }
```

### AI Copilot

```
POST /api/copilot/query
  Auth:     Officer
  Request:  { query: string, conversation_id?: string }
  Response: {
    response: string, tool_calls: ToolCall[],
    conversation_id: string
  }
  ToolCall: { tool_name, arguments: object, result: object }

GET /api/copilot/history
  Auth:     Officer
  Query:    ?limit=
  Response: { items: AIInteraction[] }
```

### Simulation (Phase 4)

```
POST /api/simulate/budget
  Auth:     Officer
  Request:  { budget: float, ward_id?: int, category?: string }
  Response: {
    options: [{
      title, category, estimated_cost, affected_population,
      priority_score, impact_estimate, cost_efficiency
    }],
    recommendation: string,
    disclaimer: "Prototype simulation — estimated impact only"
  }

POST /api/simulate/project-compare
  Auth:     Officer
  Request:  { project_options: [{ title, cost, ward_id, category }] }
  Response: { comparison: [{ ...option, score, rank }] }
```

### Root Cause (Phase 4)

```
GET /api/root-cause/{ward_id}/{category}
  Auth:     Officer
  Response: {
    possible_causes: [{ cause, confidence, evidence }],
    recommended_intervention: string,
    disclaimer: "Potential contributing factors, not confirmed engineering assessments"
  }
```

### Dashboard

```
GET /api/dashboard/summary
  Auth:     Officer
  Response: {
    total_complaints, active_complaints, high_priority_areas,
    pending_verifications, active_projects, resolved_this_month,
    avg_resolution_score
  }

GET /api/dashboard/trends
  Auth:     Officer
  Query:    ?days=30
  Response: { daily: [{ date, count, avg_severity }], by_category: [{ category, count }] }
```

### Admin

```
GET /api/admin/users
  Auth:     Admin
  Response: { items: User[] }

PATCH /api/admin/users/{id}/role
  Auth:     Admin
  Request:  { role: "citizen"|"officer"|"admin" }
  Response: { id, role }

GET /api/admin/categories
  Auth:     Admin
  Response: { categories: string[] }

POST /api/admin/seed
  Auth:     Admin
  Response: { seeded: { users, complaints, departments, wards } }

GET /api/admin/stats
  Auth:     Admin
  Response: { total_users, total_complaints, ai_calls_today, errors_today }
```

---

## Complaint Categories (Predefined)

```
Road Infrastructure, Water Supply, Drainage & Sewage, Sanitation & Waste,
Electricity, Healthcare, Education, Public Transport, Parks & Recreation,
Building & Construction, Pollution, Public Safety, Other
```

---

## Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
DATABASE_URL_SYNC=postgresql://user:pass@host/dbname

# Auth
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# AI APIs
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key

# Embedding
EMBEDDING_PROVIDER=local  # "local" for dev, "gemini" for deploy

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5

# Geocoding
NOMINATIM_USER_AGENT=civicai-hackathon

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Backend URL (for frontend .env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Priority Score Formula (Deterministic)

```python
WEIGHTS = {
    "demand": 0.30,
    "severity": 0.25,
    "population": 0.20,
    "infrastructure": 0.15,
    "unresolved": 0.10
}

def calculate_priority(ward_id, category):
    demand = normalize(complaint_count, max_complaints)          # 0-100
    severity = avg_severity(ward_id, category)                   # 1-100
    population = normalize(ward_population, max_population)      # 0-100
    infra_gap = (1 - ward.infrastructure_score) * 100            # 0-100
    unresolved = normalize(oldest_unresolved_days, 365) * 100    # 0-100

    score = sum(WEIGHTS[k] * v for k, v in locals() if k in WEIGHTS)
    return min(100, max(0, round(score)))
```

---

## Git Workflow

```
main (protected — merge only)
├── feature/backend     ← Person A
├── feature/frontend    ← Person B
├── feature/ai          ← Person C
```

- Each person works ONLY in their branch
- Merge to main every ~4 hours (Person A first, then C, then B)
- File owner resolves any conflicts on their files
- NEVER force push to main
