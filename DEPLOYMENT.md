# Production Deployment Guide: Fixity (CivicAI)

This guide provides end-to-end instructions for deploying the **CivicAI / Fixity** full-stack platform into production using **Render** (FastAPI Backend + PostgreSQL) and **Vercel** (Next.js 16 Frontend).

---

## 1. Architecture

```text
               +----------------------------------+
               |           End Users              |
               +-----------------+----------------+
                                 |
                                 | HTTPS
                                 v
               +----------------------------------+
               |         Vercel Frontend          |
               |      (Next.js 16 App Router)     |
               |  https://<your-app>.vercel.app   |
               +-----------------+----------------+
                                 |
                                 | REST API (JSON / FormData)
                                 | Authorization: Bearer <JWT>
                                 v
               +----------------------------------+
               |          Render Backend          |
               |       (FastAPI + Uvicorn)        |
               | https://<backend>.onrender.com   |
               +-----------------+----------------+
                                 |
                                 | asyncpg (SSL connection)
                                 v
               +----------------------------------+
               |       Production Database        |
               |  (Neon / Render PostgreSQL)      |
               +----------------------------------+
```

---

## 2. Prerequisites

1. **GitHub Account**: A repository containing your project code.
2. **Render Account** ([render.com](https://render.com)): For hosting the backend service (and optionally managed PostgreSQL).
3. **Vercel Account** ([vercel.com](https://vercel.com)): For hosting the Next.js frontend.
4. **PostgreSQL Database**: Hosted on [Neon](https://neon.tech), Render PostgreSQL, or Supabase.
5. **AI API Keys**:
   - **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey) (Multimodal analysis, complaint severity scoring, clustering).
   - **Groq API Key**: [Groq Cloud Console](https://console.groq.com/keys) (Whisper STT voice intake & fallback LLM).

---

## 3. Environment Variables

### A. Render Backend Environment Variables

Configure these in **Render Dashboard** > **Your Web Service** > **Environment**:

| Variable Name | Required | Example / Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | Yes | `3.11.9` |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@ep-host.region.neon.tech/civicai?ssl=require` |
| `DATABASE_URL_SYNC` | Optional | `postgresql://user:pass@ep-host.region.neon.tech/civicai?ssl=require` |
| `JWT_SECRET_KEY` | Yes | 32+ character random string (e.g. generated via `openssl rand -hex 32`) |
| `JWT_ALGORITHM` | Yes | `HS256` |
| `JWT_EXPIRATION_MINUTES`| Yes | `1440` (24 hours) |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` (from Google AI Studio) |
| `GROQ_API_KEY` | Yes | `gsk_...` (from Groq Cloud) |
| `EMBEDDING_PROVIDER` | Yes | `local` |
| `UPLOAD_DIR` | Yes | `./uploads` |
| `MAX_FILE_SIZE_MB` | Yes | `5` |
| `NOMINATIM_USER_AGENT` | Yes | `civicai-production-app` |
| `FRONTEND_URL` | Yes | `https://<your-frontend>.vercel.app` (Production Vercel domain, no trailing slash) |

> [!IMPORTANT]
> The backend `DATABASE_URL` must use the async dialect `postgresql+asyncpg://`. The backend code automatically adapts `postgres://` or `postgresql://` and sets `ssl=require`, but providing `postgresql+asyncpg://` directly is best practice.

### B. Vercel Frontend Environment Variables

Configure these in **Vercel Dashboard** > **Project Settings** > **Environment Variables**:

| Variable Name | Environment | Example / Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Production & Preview | `https://<your-backend-service>.onrender.com` (no trailing slash) |

### C. Local Development Variables

- **Backend** (`backend/.env`):
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/civicai
  DATABASE_URL_SYNC=postgresql://postgres:postgres@localhost:5432/civicai
  JWT_SECRET_KEY=dev-secret-key-change-in-production
  JWT_ALGORITHM=HS256
  JWT_EXPIRATION_MINUTES=1440
  GEMINI_API_KEY=your_gemini_key
  GROQ_API_KEY=your_groq_key
  EMBEDDING_PROVIDER=local
  UPLOAD_DIR=./uploads
  MAX_FILE_SIZE_MB=5
  NOMINATIM_USER_AGENT=civicai-local-dev
  FRONTEND_URL=http://localhost:3000
  ```
- **Frontend** (`frontend/.env.local`):
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

---

## 4. GitHub Setup

Ensure your local repository is committed and pushed to GitHub.

### Step 4.1: Verify Ignored Files
Check that no `.env`, `node_modules`, `.venv`, or uploaded media are tracked:
```bash
git status
```

### Step 4.2: Push to GitHub
```bash
git add .
git commit -m "feat: configure production deployment for Render and Vercel"
git push origin main
```
*(If pushing for the first time)*:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 5. Database Setup (Neon or Render PostgreSQL)

### Option A: Neon Serverless PostgreSQL (Recommended)
1. Sign up at [neon.tech](https://neon.tech) and create a project named `civicai`.
2. Copy the connection string. Ensure it uses `sslmode=require` or `ssl=require`.
3. Example: `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/civicai?sslmode=require`.
4. Prefix with `postgresql+asyncpg://` when setting `DATABASE_URL` on Render.

### Option B: Render Managed PostgreSQL
1. On Render Dashboard, click **New +** > **PostgreSQL**.
2. Name: `civicai-db`, Database: `civicai`, Plan: `Free` or `Starter`.
3. Copy the **Internal Database URL** (if in same region) or **External Database URL**.

### Database Migrations:
The CivicAI backend automatically executes `Base.metadata.create_all` and runs non-destructive schema migrations upon startup during the FastAPI `lifespan` event (`app/database.py`). No manual SQL scripts are required on initial launch.

---

## 6. Backend Deployment — Render

You can deploy the backend using **Blueprint (`render.yaml`)** or **Manual Web Service Setup**.

### Method: Manual Web Service Setup
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `fixity-backend` (or `civicai-backend`)
   - **Region**: Select the region closest to your users (e.g., `Oregon (US West)` or `Frankfurt (EU)`).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: `Free` or `Starter`
5. Click **Advanced** and configure:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`
6. Add Environment Variables (from Section 3.A above).
7. Click **Create Web Service**.
8. Wait for build to complete. Once deployed, note your service URL: `https://<your-service>.onrender.com`.

---

## 7. Frontend Deployment — Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Project Name**: `fixity-frontend` (or `civicai-frontend`)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: Leave default (`npm run build` or `next build`)
   - **Output Directory**: Leave default (`.next`)
   - **Install Command**: Leave default (`npm install`)
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://<your-service>.onrender.com` (Your Render backend URL with NO trailing slash)
6. Click **Deploy**.
7. Once deployed, note your Vercel URL: `https://<your-project>.vercel.app`.

---

## 8. CORS & Final Integration

Once your Vercel frontend URL is live:
1. Return to the **Render Dashboard** > **Web Service** > **Environment**.
2. Set `FRONTEND_URL` to your Vercel URL:
   ```env
   FRONTEND_URL=https://<your-project>.vercel.app
   ```
3. Save changes. Render will automatically trigger a zero-downtime redeploy.
4. The backend CORS middleware will now allow requests from your production Vercel domain as well as Vercel preview URLs.

---

## 9. Production Verification & Testing

### Step 9.1: Verify Backend
1. **Health Check**:
   ```bash
   curl -i https://<your-backend>.onrender.com/health
   ```
   *Expected response:* `HTTP/1.1 200 OK` `{"status":"healthy"}`
2. **Root Endpoint / Docs**:
   - Open `https://<your-backend>.onrender.com/` -> Returns `{"name":"CivicAI API", ...}`
   - Open `https://<your-backend>.onrender.com/docs` -> FastAPI Swagger UI.
3. **Live Public Endpoint**:
   ```bash
   curl -i https://<your-backend>.onrender.com/api/v1/complaints/public
   ```
   *Expected response:* `HTTP/1.1 200 OK` `[...]`

### Step 9.2: Verify Frontend & End-to-End Flows
1. Visit `https://<your-frontend>.vercel.app`.
2. **Authentication**:
   - Register a new citizen user (`/register`).
   - Log in (`/login`) and verify JWT token is stored in localStorage.
3. **Complaint Submission**:
   - Submit a test complaint (`/report`) with text and location.
   - Verify AI analysis triggers (Gemini severity score, category categorization).
4. **Voice Intake**:
   - Test voice recording (`/report/voice`) with Groq Whisper STT.
5. **Dashboard & Map**:
   - Open `/dashboard` and verify stats load.
   - Open `/dashboard/heatmap` to test Leaflet map rendering.
   - Open `/dashboard/copilot` to test Civic Copilot AI chat.

---

## 10. Troubleshooting

### 1. Render Build Failed (`pip install` error)
- **Likely Cause**: Incompatible binary package (e.g. `psycopg2` vs `psycopg2-binary`) or Python version mismatch.
- **Diagnosis**: Check Render Build Logs.
- **Fix**: Ensure `PYTHON_VERSION=3.11.9` is set in Render Environment Variables. `psycopg2-binary==2.9.10` and `asyncpg==0.30.0` are pre-configured in `requirements.txt`.

### 2. Render Service Crashes Immediately (`Port binding error`)
- **Likely Cause**: Hardcoded port or incorrect binding host.
- **Diagnosis**: Check Render Deploy Logs for `Address already in use` or timeout.
- **Fix**: Use `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as the Start Command.

### 3. Database Connection Error (`asyncpg / SSL error`)
- **Likely Cause**: Missing SSL parameter or unsupported `channel_binding` query param in connection string.
- **Diagnosis**: Server logs show `asyncpg.exceptions.InvalidPasswordError` or `SSL connection failed`.
- **Fix**: Ensure `DATABASE_URL` starts with `postgresql+asyncpg://` and includes `?ssl=require`. The database module (`app/database.py`) automatically strips problematic flags like `channel_binding`.

### 4. CORS Error in Browser Console (`Access-Control-Allow-Origin`)
- **Likely Cause**: `FRONTEND_URL` on Render does not match the exact Vercel frontend URL, or has a trailing slash.
- **Diagnosis**: Browser console logs `Cross-Origin Request Blocked`.
- **Fix**: Update `FRONTEND_URL` on Render to match `https://your-app.vercel.app` (without trailing slash). Note: the backend also matches all `https://*.vercel.app` preview deployments.

### 5. Frontend Calls `http://localhost:8000` in Production
- **Likely Cause**: `NEXT_PUBLIC_API_URL` was missing during Vercel build. Next.js inlines `NEXT_PUBLIC_*` variables at **build time**.
- **Diagnosis**: Network tab in Developer Tools shows failed requests to `http://localhost:8000`.
- **Fix**: Add `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com` in Vercel Project Settings > Environment Variables, then click **Redeploy** on the latest deployment.

### 6. Free-Tier Cold Starts / Slow First Request
- **Likely Cause**: Render Free Tier spins down web services after 15 minutes of inactivity.
- **Diagnosis**: First request takes 30-50 seconds to respond.
- **Fix**: Upgrade to Render Starter ($7/mo) for persistent uptime, or configure an external uptime monitor (e.g. UptimeRobot or Cron-Job.org) to ping `https://<your-backend>.onrender.com/health` every 10 minutes.

### 7. File Uploads Disappear on Render Free Tier
- **Likely Cause**: Render Free Tier uses an ephemeral filesystem that resets on every deploy or restart.
- **Diagnosis**: Uploaded images return 404 after service restarts.
- **Fix**: For persistent storage, attach a Render Persistent Disk mounted at `/uploads` or integrate cloud storage (AWS S3 / Cloudinary) in production.

---

## 11. Updating the Application

### Deploying Updates:
1. Make code changes locally and test.
2. Commit and push to `main` branch on GitHub:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin main
   ```
3. Both **Render** and **Vercel** will automatically detect the push, rebuild, and deploy the updated frontend and backend.

---

## 12. Rollback Strategy

- **Vercel Rollback**: Go to **Vercel Dashboard** > **Deployments** > locate the previous successful deployment > click `...` > **Instant Rollback**.
- **Render Rollback**: Go to **Render Dashboard** > **Web Service** > **Events** > locate previous successful deploy > click **Rollback to this deploy**.
