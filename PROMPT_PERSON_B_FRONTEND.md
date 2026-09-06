# PROMPT FOR PERSON B — FRONTEND ENGINEER

## Instructions for Antigravity

You are the **Frontend Engineer** for CivicAI — an AI-Powered Civic Decision Intelligence Platform being built in a **24-hour hackathon** by a team of 3.

**IMPORTANT:** Before doing anything, read the file `SHARED_PROJECT_CONTEXT.md` in the workspace root. It contains the full project spec, database schema, API contracts, and architecture that ALL team members share.

---

## YOUR ROLE

You own the **entire frontend**. You build:
- Next.js 14+ application with App Router
- All pages (Citizen Portal + Government Dashboard + Admin)
- All React components
- All hooks (auth, geolocation, API calls)
- API client (fetch wrapper for backend)
- TypeScript interfaces matching backend schemas
- Tailwind CSS styling with shadcn/ui components
- Leaflet map integration with heatmap
- Responsive, professional UI

---

## FILES YOU OWN (only modify these)

```
frontend/                        ✅ EVERYTHING IN HERE IS YOURS
├── src/
│   ├── app/                     ✅ All pages
│   ├── components/              ✅ All components
│   ├── lib/                     ✅ API client, auth, types, utils
│   └── hooks/                   ✅ All hooks
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## FILES YOU DO NOT TOUCH

```
backend/*                        ❌ Person A + Person C
```

---

## SETUP INSTRUCTIONS

**Hour 0: Initialize the frontend project**

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npx shadcn@latest init
```

**Install these packages:**
```bash
npm install react-leaflet leaflet leaflet.heat @types/leaflet
npm install recharts
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install js-cookie @types/js-cookie
```

**shadcn/ui components to install:**
```bash
npx shadcn@latest add button card input label textarea select badge
npx shadcn@latest add dialog sheet tabs table separator
npx shadcn@latest add avatar dropdown-menu toast sonner
npx shadcn@latest add form command popover scroll-area
```

**.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## TYPESCRIPT INTERFACES (lib/types.ts)

Create these interfaces to match the backend API contract exactly:

```typescript
// ============================================================
// AUTH
// ============================================================
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'officer' | 'admin';
  preferred_language: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
  preferred_language?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================
// COMPLAINTS
// ============================================================
export interface ComplaintCreate {
  original_text: string;
  latitude: number;
  longitude: number;
  language?: string;
  category?: string;
}

export interface Complaint {
  id: string;
  citizen_id: string;
  original_text: string;
  translated_text?: string;
  detected_language?: string;
  category?: string;
  subcategory?: string;
  ai_description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  ward_id?: number;
  district_id?: number;
  severity?: number;
  status: ComplaintStatus;
  department_id?: number;
  cluster_id?: string;
  ai_analysis?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ComplaintStatus =
  | 'submitted'
  | 'analyzing'
  | 'analyzed'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'verified';

export interface ComplaintDetail extends Complaint {
  evidence: Evidence[];
  analysis?: AnalysisResult;
  cluster?: ClusterSummary;
  verifications: Verification[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// ============================================================
// EVIDENCE
// ============================================================
export interface Evidence {
  id: string;
  complaint_id: string;
  evidence_type: 'photo' | 'audio' | 'document';
  file_url?: string;
  mime_type?: string;
  ai_analysis?: Record<string, any>;
  created_at: string;
}

// ============================================================
// AI ANALYSIS
// ============================================================
export interface AnalysisResult {
  id: string;
  complaint_id: string;
  detected_language: string;
  translated_text: string;
  category: string;
  subcategory?: string;
  severity: number;
  issues: string[];
  possible_related_issue?: string;
  suggested_department: string;
  summary: string;
  confidence: number;
  model_used: string;
  analyzed_at: string;
}

// ============================================================
// CLUSTERS
// ============================================================
export interface ClusterSummary {
  id: string;
  representative_text: string;
  category: string;
  ward_id?: number;
  complaint_count: number;
  avg_severity: number;
}

export interface ClusterDetail extends ClusterSummary {
  complaints: Complaint[];
}

// ============================================================
// PRIORITY
// ============================================================
export interface PriorityScore {
  id: string;
  ward_id: number;
  ward_name: string;
  category?: string;
  total_score: number;
  demand_score: number;
  severity_score: number;
  population_score: number;
  infrastructure_gap_score: number;
  unresolved_score: number;
  explanation?: Record<string, any>;
}

export interface HotspotPoint {
  lat: number;
  lng: number;
  weight: number;
}

// ============================================================
// PROJECTS
// ============================================================
export interface ProjectCreate {
  title: string;
  description: string;
  category: string;
  ward_id: number;
  department_id: number;
  estimated_cost: number;
  affected_population: number;
  complaint_ids: string[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  category: string;
  ward_id?: number;
  department_id?: number;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost?: number;
  affected_population?: number;
  priority_score?: number;
  ai_recommendation?: Record<string, any>;
  approved_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ProjectDetail extends Project {
  complaints: Complaint[];
  verifications: Verification[];
  impact?: ImpactMeasurement;
}

// ============================================================
// VERIFICATION
// ============================================================
export interface Verification {
  id: string;
  complaint_id: string;
  project_id?: string;
  citizen_id: string;
  rating: number;
  comment?: string;
  photo_path?: string;
  is_resolved: boolean;
  verification_status: 'matches' | 'partial' | 'mismatch';
  created_at: string;
}

// ============================================================
// IMPACT
// ============================================================
export interface ImpactMeasurement {
  project_id: string;
  before_severity: number;
  after_severity: number;
  resolution_score: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
  is_estimated: boolean;
}

// ============================================================
// COPILOT
// ============================================================
export interface CopilotQuery {
  query: string;
  conversation_id?: string;
}

export interface CopilotResponse {
  response: string;
  tool_calls: ToolCall[];
  conversation_id: string;
}

export interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

// ============================================================
// DASHBOARD
// ============================================================
export interface DashboardSummary {
  total_complaints: number;
  active_complaints: number;
  high_priority_areas: number;
  pending_verifications: number;
  active_projects: number;
  resolved_this_month: number;
  avg_resolution_score: number;
}

export interface TrendData {
  daily: { date: string; count: number; avg_severity: number }[];
  by_category: { category: string; count: number }[];
}

// ============================================================
// SIMULATION
// ============================================================
export interface SimulationRequest {
  budget: number;
  ward_id?: number;
  category?: string;
}

export interface SimulationResult {
  options: {
    title: string;
    category: string;
    estimated_cost: number;
    affected_population: number;
    priority_score: number;
    impact_estimate: number;
    cost_efficiency: number;
  }[];
  recommendation: string;
  disclaimer: string;
}

// ============================================================
// VOICE
// ============================================================
export interface TranscriptionResult {
  text: string;
  detected_language: string;
  confidence: number;
}

// ============================================================
// TIMELINE
// ============================================================
export interface TimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  actor?: string;
}
```

---

## API CLIENT (lib/api.ts)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('civicai_token')
    : null;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => fetchAPI<T>(url),
  post: <T>(url: string, body?: any) =>
    fetchAPI<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(url: string, body: any) =>
    fetchAPI<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) =>
    fetchAPI<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
};
```

---

## KEY HOOKS TO IMPLEMENT

### useAuth.ts
```typescript
// Manages JWT token in localStorage
// Provides: user, login(), register(), logout(), isAuthenticated, isOfficer, isAdmin
// On mount: check token, call GET /api/auth/me to validate
// On login: store token, redirect based on role (citizen→/complaints, officer→/dashboard)
```

### useGeolocation.ts
```typescript
// Uses navigator.geolocation.getCurrentPosition()
// Returns: { latitude, longitude, loading, error }
// Called on Report page to auto-detect citizen's location
// Falls back to null if permission denied (citizen must then pick manually on map)
```

### useComplaints.ts
```typescript
// Fetches complaint list with filters
// Provides: complaints, loading, error, refetch
// Supports pagination
```

---

## PAGES TO BUILD — PHASE BY PHASE

### Phase 1: Core Demo (Hours 0-8)

**Hour 0-1: Project Setup + Landing Page**
1. Initialize Next.js project (see setup above)
2. Create layout.tsx with:
   - Navbar (Logo, links based on role, login/register buttons)
   - Conditional sidebar for dashboard pages
3. Create Landing page (`/`):
   - Hero section: "From Citizen Voice to Verified Impact"
   - 3-4 feature cards (Report, Analyze, Track, Verify)
   - CTA: "Report a Problem" / "Government Dashboard"

**Hour 1-2: Auth Pages**
1. Login page (`/login`):
   - Email + password form
   - Submit calls POST /api/auth/login
   - Store JWT in localStorage
   - Redirect: citizen → /complaints, officer → /dashboard
2. Register page (`/register`):
   - Full name, email, password, phone (optional)
   - Language preference dropdown (English, Hindi, Bengali, Tamil, etc.)
   - Role selector (hidden or default "citizen" for public, "officer" for demo)
   - Submit calls POST /api/auth/register
3. Implement `useAuth` hook + auth context provider

**Hour 2-3: Report Problem Page**
1. Report page (`/report`):
   - Text area for complaint description
   - Language selector dropdown
   - **Map component** (Leaflet):
     - Auto-center on user's GPS location (useGeolocation hook)
     - Draggable marker for fine-tuning
     - Display address from reverse geocoding (or just coords)
   - Photo upload button (with preview)
   - Submit button
   - On submit:
     1. POST /api/complaints (text + lat/lng)
     2. If photo: POST /api/complaints/{id}/evidence
     3. Trigger analysis: POST /api/complaints/{id}/analyze
     4. Redirect to complaint detail

**IMPORTANT — Leaflet in Next.js:**
Leaflet uses `window` which breaks SSR. Use dynamic import:
```typescript
import dynamic from 'next/dynamic';
const MapComponent = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted rounded-lg animate-pulse" />,
});
```

**Hour 3-4: Voice Report Page**
1. Voice page (`/report/voice`):
   - Record button (uses MediaRecorder API)
   - Audio visualization (simple waveform or just recording indicator)
   - Stop → sends audio to POST /api/voice/transcribe
   - Shows transcription text (editable)
   - "Use this text" button → redirects to /report with text pre-filled
   - Language hint selector

**Hour 4-6: My Complaints + Complaint Detail**
1. My Complaints page (`/complaints`):
   - List of citizen's complaints (GET /api/complaints/my)
   - Each card shows: text snippet, category badge, severity bar, status badge, date
   - Click → navigate to detail
2. Complaint Detail page (`/complaints/[id]`):
   - Header: category, severity, status badge
   - Original text (in citizen's language) + translated text
   - AI Analysis card:
     - Detected language, category, subcategory
     - Issues (tag badges)
     - Severity meter (colored bar: green/yellow/red)
     - Suggested department
     - Related issue
   - Evidence section: photo thumbnails, audio player
   - Image analysis card (if available): detected issues from photo
   - Cluster info: "Part of X similar reports"
   - Timeline: status history (vertical timeline component)

**Hour 6-8: Government Dashboard**
1. Dashboard page (`/dashboard`):
   - 4-6 summary stat cards at top:
     - Total Active Issues (number, icon)
     - High Priority Areas (number, icon)
     - Pending Verifications (number, icon)
     - Active Projects (number, icon)
     - Resolved This Month (number, icon)
   - Embedded mini-heatmap (Leaflet, smaller)
   - Top 5 Priority Problems list (category + score bar)
   - Click any → navigate to detail
2. Dashboard Complaints page (`/dashboard/complaints`):
   - Table (shadcn Table) with columns: ID, Text, Category, Ward, Severity, Status, Date
   - Filters: category dropdown, status dropdown, severity range
   - Click row → detail page

---

### Phase 2: Intelligence Layer (Hours 8-14)

**Hour 8-10: Heatmap Page (Full Page)**
1. Heatmap page (`/dashboard/heatmap`):
   - Full-page Leaflet map
   - Heat layer using leaflet.heat:
     ```typescript
     // Fetch hotspot data: GET /api/hotspots
     // Data: [{lat, lng, weight}]
     // Use L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 })
     ```
   - Ward boundaries overlay (GeoJSON if available)
   - Click on a hotspot area → popup/sidebar with:
     - Ward name
     - Priority score
     - Top issues
     - Complaint count
     - "View Details" link

**Hour 10-11: Priority Areas Page**
1. Priority page (`/dashboard/priorities`):
   - Ranked list of wards by priority score
   - Each card:
     - Ward name + rank badge
     - Total score (large number, colored)
     - Score breakdown bar chart (Recharts):
       - Demand, Severity, Population, Infrastructure Gap, Unresolved
     - Top issues list
     - "View Complaints" link
   - Click → GET /api/priority-areas/{ward_id} for details

**Hour 11-12: Clusters Page**
1. Clusters page (`/dashboard/clusters`):
   - List of complaint clusters
   - Each card:
     - Representative text
     - Category badge
     - Complaint count (large number)
     - Avg severity
     - "View X complaints" expandable
   - Clicking expand → shows individual complaints in that cluster

**Hour 12-14: AI Copilot Page**
1. Copilot page (`/dashboard/copilot`):
   - Chat-style UI:
     - Message list (scrollable)
     - User messages (right-aligned, blue)
     - AI responses (left-aligned, gray)
   - Input bar at bottom with send button
   - **Tool Call Display** (this is important for the demo):
     - When AI uses a tool, show a collapsible card:
       ```
       🔧 Called: get_priority_area_details(ward_id=7)
       [Expand to see raw data]
       ```
     - This proves to judges that AI is using real data
   - Suggested queries (chips above input):
     - "Top 5 urgent problems"
     - "Why is this area high priority?"
     - "What should I do about road issues?"
     - "Compare project options"
   - POST /api/copilot/query on send
   - Display streaming-like effect (type out response word by word using interval)

---

### Phase 3: Closed Loop (Hours 14-19)

**Hour 14-15: Projects Page**
1. Projects list page (`/dashboard/projects`):
   - Table: Title, Category, Ward, Status, Cost, Priority
   - Filter by status
   - "Create Project" button → modal/dialog
2. Create Project dialog:
   - Title, description, category, ward, department
   - Estimated cost, affected population
   - Select complaints to link (checkbox list or search)
   - Submit → POST /api/projects

**Hour 15-16: Project Detail Page**
1. Project Detail (`/dashboard/projects/[id]`):
   - Status badge + status change buttons (Approve, Start, Complete)
   - Project info card
   - Linked complaints list
   - Timeline of status changes
   - Impact section (appears after completion)

**Hour 16-17: Verification Page**
1. Verify page (`/complaints/[id]/verify`):
   - Only visible when complaint status is "resolved"
   - "Was this problem actually fixed?"
   - Star rating (1-5)
   - Comment text area
   - Photo upload (after-intervention photo)
   - "Yes, fully resolved" / "Partially improved" / "Not fixed" radio buttons
   - Submit → POST /api/complaints/{id}/verify

**Hour 17-18: Impact View Page**
1. Impact page (`/complaints/[id]/impact`):
   - Before/After comparison:
     - Before severity: red bar (e.g., 90/100)
     - After severity: green bar (e.g., 35/100)
     - Big number: "61% Resolved"
   - **Label**: "Illustrative prototype metric" (mandatory!)
   - Confidence indicator
   - Factors list
   - Citizen verification summary
   - Before/after photos side by side (if available)

**Hour 18-19: Impact Analytics Dashboard**
1. Impact Analytics page (`/dashboard/impact`):
   - Recharts charts:
     - Resolution scores across projects (bar chart)
     - Citizen satisfaction trend (line chart)
     - Verification status breakdown (pie chart: matches/partial/mismatch)
   - Summary stats: avg resolution score, total verifications, satisfaction rate

---

### Phase 4: Wow Factor (Hours 19-22)

**Hour 19-20: What-If Simulator Page**
1. Simulator page (`/dashboard/simulator`):
   - Budget input (₹ amount slider or number input)
   - Optional: ward filter, category filter
   - "Simulate" button → POST /api/simulate/budget
   - Results: comparison cards for each project option:
     - Title, category, cost, affected population, priority score, impact estimate
     - Cost efficiency metric
     - Recommended option highlighted
   - Disclaimer: "Prototype simulation — estimated impact only"

**Hour 20-22: Polish Everything**
1. Responsive design check (mobile + desktop)
2. Loading states (skeleton loaders for all data-fetching pages)
3. Error states (friendly error messages, retry buttons)
4. Empty states ("No complaints yet" with CTA)
5. Toast notifications (sonner) for success/error actions
6. Dark mode toggle (optional, if time)
7. Favicon, page titles, meta descriptions

---

### Phase 5: Deploy (Hours 22-24)

1. Set NEXT_PUBLIC_API_URL to Render production URL in Vercel env vars
2. Push to GitHub, connect to Vercel
3. Deploy
4. Test all pages on production
5. Run through demo flow once on production

---

## UI DESIGN GUIDELINES

1. **Color palette:**
   - Primary: Blue (#2563EB) — trust, governance
   - Success/Low severity: Green (#16A34A)
   - Warning/Medium severity: Orange (#F97316)
   - Danger/High severity: Red (#DC2626)
   - Background: White/Gray (#F9FAFB)

2. **Severity visualization:**
   - 1-30: Green badge + bar
   - 31-60: Yellow/Orange badge + bar
   - 61-100: Red badge + bar

3. **Status badges:**
   - Submitted: Gray
   - Analyzing: Blue (pulsing)
   - Analyzed: Blue
   - Assigned: Purple
   - In Progress: Orange
   - Resolved: Green
   - Verified: Green (with checkmark)

4. **Layout:**
   - Citizen pages: simple top navbar, centered content, max-w-4xl
   - Dashboard pages: sidebar navigation (collapsible), full-width content
   - Admin pages: same sidebar as dashboard with admin section

5. **Don't overdesign.** Clean, professional, functional. Not futuristic. shadcn/ui default styling is perfect.

---

## COORDINATION WITH TEAMMATES

### What Person A (Backend) provides you:
- FastAPI auto-docs at `http://localhost:8000/docs` — test all endpoints there
- CORS is configured for your localhost:3000
- Auth endpoints available from Hour 2
- Complaint endpoints from Hour 4
- Dashboard/Priority/Cluster endpoints from Hour 10
- Project/Verification/Impact endpoints from Hour 16

### What Person C (AI) provides you:
- Nothing directly — Person C's work goes through the backend API
- But the analysis results, copilot responses, etc. come from their services

### What you provide:
- A working, beautiful UI that makes the demo impressive
- The frontend is what judges SEE — it matters the most visually

### If backend endpoints aren't ready yet:
- Create **mock data** in your components temporarily
- Use the TypeScript interfaces above to create realistic mock objects
- Replace with real API calls as soon as endpoints are available
- This way you're never blocked

---

## CRITICAL RULES

1. **Leaflet must be dynamically imported** — `import dynamic from 'next/dynamic'` with `ssr: false`
2. **Always handle loading and error states** — every API call needs a loading spinner and error fallback
3. **JWT token goes in localStorage** — read it in the API client, send as Bearer header
4. **Never expose API keys in frontend** — all AI calls go through backend
5. **Role-based routing**: citizens can't access /dashboard, officers can't access /complaints/my (or show different views)
6. **File uploads use FormData** — not JSON
7. **Map must work without GPS** — if geolocation is denied, show a default location and let user pick manually
8. **Resolution score MUST show "Illustrative prototype metric" label** — this is a hackathon requirement
9. **Keep the app runnable at all times** — incremental pages, never break the build
10. **The Copilot tool-call display is critical for the demo** — judges need to see that AI is using real data, not making things up
