# PROMPT FOR PERSON C — AI + INTEGRATION ENGINEER

## Instructions for Antigravity

You are the **AI + Integration Engineer** for CivicAI — an AI-Powered Civic Decision Intelligence Platform being built in a **24-hour hackathon** by a team of 3.

**IMPORTANT:** Before doing anything, read the file `SHARED_PROJECT_CONTEXT.md` in the workspace root. It contains the full project spec, database schema, API contracts, and architecture that ALL team members share.

---

## YOUR ROLE

You own **all AI integrations, LLM services, and intelligent features**. You build:
- Gemini API client wrapper (structured output, function calling, multimodal)
- Groq API client wrapper (Whisper STT, backup LLM)
- Complaint analysis service (structured extraction from text)
- Image analysis service (multimodal photo understanding)
- Speech-to-text service (Groq Whisper)
- Embedding service (local sentence-transformers ↔ Gemini embedding)
- Complaint clustering service (embeddings + DBSCAN)
- Government AI Copilot service (Gemini function calling + backend tools)
- Simulation service (budget what-if)
- Root cause analysis service
- All AI prompt templates
- AI output validation schemas

---

## FILES YOU OWN (only modify these)

```
backend/app/
├── ai/                              ✅ ALL YOURS
│   ├── __init__.py                  ✅ YOU
│   ├── gemini_client.py             ✅ YOU
│   ├── groq_client.py               ✅ YOU
│   ├── prompts.py                   ✅ YOU
│   ├── schemas.py                   ✅ YOU
│   └── tools.py                     ✅ YOU
│
├── services/
│   ├── analysis_service.py          ✅ YOU
│   ├── speech_service.py            ✅ YOU
│   ├── image_service.py             ✅ YOU
│   ├── embedding_service.py         ✅ YOU
│   ├── cluster_service.py           ✅ YOU
│   ├── copilot_service.py           ✅ YOU
│   ├── simulation_service.py        ✅ YOU
│   └── root_cause_service.py        ✅ YOU (create this file)
│
├── schemas/
│   ├── analysis.py                  ✅ YOU
│   └── copilot.py                   ✅ YOU
│
├── api/
│   ├── copilot.py                   ✅ YOU
│   └── voice.py                     ✅ YOU
```

## FILES YOU DO NOT TOUCH

```
backend/app/models/*                 ❌ Person A (you import, don't modify)
backend/app/api/auth.py              ❌ Person A
backend/app/api/complaints.py        ❌ Person A (they call your services)
backend/app/api/projects.py          ❌ Person A
backend/app/core/*                   ❌ Person A
backend/app/main.py                  ❌ Person A (they register your routers)
backend/app/config.py                ❌ Person A (they include your env vars)
frontend/*                           ❌ Person B
```

---

## SETUP INSTRUCTIONS

**Additional dependencies to add to requirements.txt (coordinate with Person A):**
```
google-generativeai==0.8.3
groq==0.11.0
sentence-transformers==3.3.0
scikit-learn==1.5.2
numpy==1.26.4
```

**Environment variables needed (coordinate with Person A to add to config.py):**
```
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
EMBEDDING_PROVIDER=local    # "local" for dev, "gemini" for deployment
```

---

## WHAT TO BUILD — DETAILED SPECIFICATIONS

### 1. Gemini Client Wrapper (`ai/gemini_client.py`)

```python
"""
Wrapper for Google Gemini API.
Handles: structured JSON output, multimodal input, function calling, error handling.
"""
import google.generativeai as genai
from app.config import settings

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.flash_model = genai.GenerativeModel("gemini-2.0-flash")
        self.flash25_model = genai.GenerativeModel("gemini-2.5-flash")

    async def analyze_text(self, text: str, system_prompt: str, response_schema: dict) -> dict:
        """
        Send text to Gemini 2.0 Flash with structured JSON output.
        Uses response_mime_type="application/json" and response_schema.
        Returns validated JSON dict.
        Retry up to 2 times on failure.
        """
        ...

    async def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> dict:
        """
        Send image + text prompt to Gemini 2.0 Flash (multimodal).
        Returns structured JSON analysis.
        """
        ...

    async def chat_with_tools(self, messages: list, tools: list, system_prompt: str) -> dict:
        """
        Send conversation to Gemini 2.5 Flash with function calling.
        Returns: { response_text, tool_calls: [{name, args, result}] }
        Used by the Copilot service.
        """
        ...

    async def get_embedding(self, text: str) -> list[float]:
        """
        Get text embedding using Gemini embedding model.
        Model: models/text-embedding-004
        Used when EMBEDDING_PROVIDER=gemini
        """
        ...
```

**Error handling pattern:**
```python
import asyncio
import logging

logger = logging.getLogger(__name__)

async def _call_with_retry(self, func, max_retries=2):
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except Exception as e:
            logger.error(f"Gemini API error (attempt {attempt+1}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(1 * (attempt + 1))  # backoff
            else:
                raise
```

---

### 2. Groq Client Wrapper (`ai/groq_client.py`)

```python
"""
Wrapper for Groq API.
Handles: Whisper speech-to-text, backup LLM (Llama 3.3 70B).
"""
from groq import Groq
from app.config import settings

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    async def transcribe_audio(self, audio_bytes: bytes, filename: str,
                                language: str | None = None) -> dict:
        """
        Transcribe audio using Whisper large-v3-turbo.
        Input: audio bytes, original filename (for extension), optional language hint
        Output: { text, detected_language, confidence }

        IMPORTANT: Pass language hint (e.g., "hi" for Hindi) when available
        to improve accuracy and reduce latency.
        """
        response = self.client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=(filename, audio_bytes),
            language=language,  # ISO code: "hi", "en", "bn", etc.
            response_format="verbose_json",
        )
        return {
            "text": response.text,
            "detected_language": response.language or language or "unknown",
            "confidence": getattr(response, 'avg_logprob', 0.0)
        }

    async def chat_completion(self, messages: list, system_prompt: str) -> str:
        """
        Backup LLM using Llama 3.3 70B.
        Used when Gemini is unavailable.
        Returns plain text response.
        """
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return response.choices[0].message.content
```

---

### 3. AI Prompt Templates (`ai/prompts.py`)

```python
COMPLAINT_ANALYSIS_PROMPT = """You are a civic complaint analyst for an Indian government platform.

Analyze the following citizen complaint and extract structured information.

RULES:
1. Detect the language of the input text.
2. If the text is not in English, provide an English translation in translated_text.
3. Classify into one of these categories: Road Infrastructure, Water Supply, Drainage & Sewage, Sanitation & Waste, Electricity, Healthcare, Education, Public Transport, Parks & Recreation, Building & Construction, Pollution, Public Safety, Other
4. Assign severity from 1 (minor inconvenience) to 100 (life-threatening emergency).
   - 1-20: Minor cosmetic issue
   - 21-40: Moderate inconvenience
   - 41-60: Significant problem affecting daily life
   - 61-80: Serious issue affecting health/safety
   - 81-100: Critical/emergency situation
5. Extract specific issues mentioned.
6. Identify if there's a related underlying issue not explicitly mentioned.
7. Suggest the responsible government department.
8. Provide a brief English summary.

Citizen complaint:
{complaint_text}
"""

COMPLAINT_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "detected_language": {"type": "string", "description": "ISO 639-1 code"},
        "translated_text": {"type": "string", "description": "English translation if not English"},
        "category": {"type": "string", "enum": [
            "Road Infrastructure", "Water Supply", "Drainage & Sewage",
            "Sanitation & Waste", "Electricity", "Healthcare", "Education",
            "Public Transport", "Parks & Recreation", "Building & Construction",
            "Pollution", "Public Safety", "Other"
        ]},
        "subcategory": {"type": "string"},
        "severity": {"type": "integer", "minimum": 1, "maximum": 100},
        "issues": {"type": "array", "items": {"type": "string"}},
        "possible_related_issue": {"type": "string"},
        "suggested_department": {"type": "string"},
        "summary": {"type": "string"}
    },
    "required": ["detected_language", "category", "severity", "issues", "suggested_department", "summary"]
}

IMAGE_ANALYSIS_PROMPT = """You are analyzing a photo submitted by a citizen as evidence of a civic infrastructure problem.

Context: The citizen reported: "{complaint_text}"

Analyze the image and identify:
1. What civic infrastructure issues are visible (potholes, waterlogging, garbage, broken pipes, etc.)
2. Estimated severity (1-100)
3. A brief description of what you see

Be factual. Only describe what is actually visible in the image.
If the image is unclear or not related to civic infrastructure, say so.
"""

IMAGE_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "detected_issues": {"type": "array", "items": {"type": "string"}},
        "severity_estimate": {"type": "integer", "minimum": 1, "maximum": 100},
        "description": {"type": "string"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "is_relevant": {"type": "boolean"}
    },
    "required": ["detected_issues", "severity_estimate", "description", "confidence", "is_relevant"]
}

COPILOT_SYSTEM_PROMPT = """You are CivicAI Government Copilot — an AI assistant for government officers managing civic infrastructure.

You have access to tools that query the CivicAI database. ALWAYS use these tools to answer questions about:
- Priority areas, complaint data, ward statistics
- Project options, budget simulations, impact data
- Complaint clusters, trending issues

RULES:
1. NEVER make up data. If you don't have information, say so.
2. ALWAYS call a tool before answering data questions.
3. Use clear, professional language suitable for government officers.
4. When discussing priorities, explain WHY an area is ranked high.
5. When recommending projects, show evidence and cost-efficiency.
6. Use Indian Rupee (₹) for currency. Use Crore/Lakh notation.
7. When showing scores, explain what the components mean.
8. Be concise but thorough.
9. If asked about something outside CivicAI data, say "I can only answer questions about CivicAI data."
"""

ROOT_CAUSE_PROMPT = """You are analyzing complaint patterns for a specific area and category.

Area: {ward_name} (Ward {ward_id})
Category: {category}
Complaint count: {complaint_count}
Average severity: {avg_severity}
Common issues reported: {common_issues}
Co-occurring categories: {co_occurring}
Infrastructure data: {infrastructure_data}

Based on these patterns, identify:
1. Possible root causes (be careful — say "possible" not "confirmed")
2. How confident you are in each cause
3. What evidence supports each cause
4. A recommended intervention that addresses root causes, not just symptoms

IMPORTANT: Use language like "possible contributing factor" and "potential cause".
Do NOT claim scientific certainty.
"""

ROOT_CAUSE_SCHEMA = {
    "type": "object",
    "properties": {
        "possible_causes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "cause": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                    "evidence": {"type": "string"}
                },
                "required": ["cause", "confidence", "evidence"]
            }
        },
        "recommended_intervention": {"type": "string"},
        "disclaimer": {"type": "string"}
    },
    "required": ["possible_causes", "recommended_intervention", "disclaimer"]
}
```

---

### 4. AI Output Validation Schemas (`ai/schemas.py`)

```python
"""Pydantic models for validating AI outputs."""
from pydantic import BaseModel, Field

class ComplaintAnalysisOutput(BaseModel):
    detected_language: str
    translated_text: str | None = None
    category: str
    subcategory: str | None = None
    severity: int = Field(ge=1, le=100)
    issues: list[str]
    possible_related_issue: str | None = None
    suggested_department: str
    summary: str

class ImageAnalysisOutput(BaseModel):
    detected_issues: list[str]
    severity_estimate: int = Field(ge=1, le=100)
    description: str
    confidence: str  # high, medium, low
    is_relevant: bool = True

class RootCauseOutput(BaseModel):
    possible_causes: list[dict]  # [{cause, confidence, evidence}]
    recommended_intervention: str
    disclaimer: str
```

---

### 5. Analysis Service (`services/analysis_service.py`)

```python
"""
Complaint analysis pipeline:
1. Take complaint text (+ optional image)
2. Send to Gemini for structured extraction
3. Validate output with Pydantic
4. Store result in complaint_analysis table
5. Update complaint with extracted fields
6. Fallback to Groq if Gemini fails
"""

class AnalysisService:
    def __init__(self):
        self.gemini = GeminiClient()
        self.groq = GroqClient()

    async def analyze_complaint(self, complaint_id: UUID, db: AsyncSession) -> dict:
        """
        Full analysis pipeline for a complaint.
        Called by Person A's POST /api/complaints/{id}/analyze endpoint.
        """
        # 1. Get complaint from DB
        complaint = await get_complaint(complaint_id, db)

        # 2. Update status to 'analyzing'
        complaint.status = 'analyzing'
        await db.commit()

        try:
            # 3. Call Gemini for text analysis
            result = await self.gemini.analyze_text(
                text=complaint.original_text,
                system_prompt=COMPLAINT_ANALYSIS_PROMPT.format(
                    complaint_text=complaint.original_text
                ),
                response_schema=COMPLAINT_ANALYSIS_SCHEMA
            )

            # 4. Validate with Pydantic
            validated = ComplaintAnalysisOutput(**result)

        except Exception as e:
            # 5. FALLBACK: Try Groq
            logger.warning(f"Gemini failed, trying Groq: {e}")
            try:
                result = await self._analyze_with_groq(complaint.original_text)
                validated = ComplaintAnalysisOutput(**result)
            except Exception as e2:
                logger.error(f"All AI providers failed: {e2}")
                complaint.status = 'submitted'  # Reset status
                await db.commit()
                raise HTTPException(500, "Analysis temporarily unavailable")

        # 6. Store analysis result
        analysis = ComplaintAnalysis(
            complaint_id=complaint_id,
            model_used="gemini-2.0-flash",
            structured_output=validated.model_dump(),
            extracted_issues=validated.issues,
            suggested_category=validated.category,
            suggested_severity=validated.severity,
            suggested_department=validated.suggested_department,
            confidence=0.85,  # from model response
        )
        db.add(analysis)

        # 7. Update complaint with extracted fields
        complaint.translated_text = validated.translated_text
        complaint.detected_language = validated.detected_language
        complaint.category = validated.category
        complaint.subcategory = validated.subcategory
        complaint.severity = validated.severity
        complaint.ai_description = validated.summary
        complaint.ai_analysis = validated.model_dump()
        complaint.status = 'analyzed'
        # Assign department based on suggestion
        # (lookup department_id from departments table)

        await db.commit()
        return validated.model_dump()
```

---

### 6. Image Service (`services/image_service.py`)

```python
class ImageService:
    def __init__(self):
        self.gemini = GeminiClient()

    async def analyze_image(self, image_path: str, complaint_text: str) -> dict:
        """
        Analyze a civic photo using Gemini multimodal.
        Returns: ImageAnalysisOutput dict
        """
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        mime_type = self._get_mime_type(image_path)  # image/jpeg, image/png

        result = await self.gemini.analyze_image(
            image_bytes=image_bytes,
            mime_type=mime_type,
            prompt=IMAGE_ANALYSIS_PROMPT.format(complaint_text=complaint_text)
        )

        validated = ImageAnalysisOutput(**result)
        return validated.model_dump()
```

---

### 7. Speech Service (`services/speech_service.py`)

```python
class SpeechService:
    def __init__(self):
        self.groq = GroqClient()

    async def transcribe(self, audio_bytes: bytes, filename: str,
                          language: str | None = None) -> dict:
        """
        Transcribe audio using Groq Whisper.
        Returns: { text, detected_language, confidence }

        Fallback: If Groq fails, try Gemini native audio (multimodal).
        """
        try:
            return await self.groq.transcribe_audio(audio_bytes, filename, language)
        except Exception as e:
            logger.warning(f"Groq Whisper failed: {e}, trying Gemini audio")
            return await self._fallback_gemini_audio(audio_bytes, filename)
```

**API route (`api/voice.py`):**
```python
@router.post("/api/voice/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: str | None = Form(None),
    current_user: User = Depends(get_current_user)
):
    # Validate file type and size
    if audio_file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(400, "Unsupported audio format")

    audio_bytes = await audio_file.read()
    if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB Groq limit
        raise HTTPException(400, "Audio file too large (max 25MB)")

    service = SpeechService()
    result = await service.transcribe(audio_bytes, audio_file.filename, language)
    return result
```

---

### 8. Embedding Service (`services/embedding_service.py`)

```python
"""
Abstraction: local sentence-transformers for dev, Gemini API for deployment.
Switch via EMBEDDING_PROVIDER env var.
"""

class EmbeddingService:
    def __init__(self, provider: str = None):
        self.provider = provider or settings.EMBEDDING_PROVIDER  # "local" or "gemini"
        self._local_model = None

    def _get_local_model(self):
        """Lazy-load sentence-transformers model (~80MB, first call only)."""
        if self._local_model is None:
            from sentence_transformers import SentenceTransformer
            self._local_model = SentenceTransformer('all-MiniLM-L6-v2')
        return self._local_model

    async def get_embedding(self, text: str) -> list[float]:
        if self.provider == "local":
            return self._local_embedding(text)
        else:
            return await self._gemini_embedding(text)

    async def get_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        if self.provider == "local":
            return self._local_embeddings_batch(texts)
        else:
            # Gemini doesn't have batch embedding, call individually
            return [await self._gemini_embedding(t) for t in texts]

    def _local_embedding(self, text: str) -> list[float]:
        model = self._get_local_model()
        return model.encode(text).tolist()

    def _local_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        model = self._get_local_model()
        return model.encode(texts).tolist()

    async def _gemini_embedding(self, text: str) -> list[float]:
        gemini = GeminiClient()
        return await gemini.get_embedding(text)
```

---

### 9. Cluster Service (`services/cluster_service.py`)

```python
"""
Complaint clustering using embeddings + DBSCAN.
Groups similar complaints about the same underlying issue.
"""
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class ClusterService:
    def __init__(self):
        self.embedding_service = EmbeddingService()

    async def refresh_clusters(self, db: AsyncSession) -> dict:
        """
        Re-cluster all complaints.
        Called by POST /api/clusters/refresh

        Algorithm:
        1. Get all complaints with text
        2. Generate embeddings
        3. Run DBSCAN with cosine distance
        4. Create/update cluster records
        5. Assign complaints to clusters
        """
        # 1. Get complaints
        complaints = await get_all_complaints(db)

        if len(complaints) < 2:
            return {"clusters_created": 0, "complaints_clustered": 0}

        # 2. Get embeddings
        texts = [c.original_text for c in complaints]
        embeddings = await self.embedding_service.get_embeddings_batch(texts)
        embeddings_array = np.array(embeddings)

        # 3. DBSCAN clustering
        # eps=0.3 means complaints with cosine similarity > 0.7 are clustered
        # min_samples=2 means at least 2 similar complaints to form a cluster
        similarity_matrix = cosine_similarity(embeddings_array)
        distance_matrix = 1 - similarity_matrix

        clustering = DBSCAN(
            eps=0.3,
            min_samples=2,
            metric='precomputed'
        ).fit(distance_matrix)

        labels = clustering.labels_

        # 4. Create clusters
        clusters_created = 0
        complaints_clustered = 0

        # Clear existing clusters
        await clear_clusters(db)

        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:  # Noise — unclustered complaints
                continue

            cluster_indices = [i for i, l in enumerate(labels) if l == label]
            cluster_complaints = [complaints[i] for i in cluster_indices]

            # Create cluster record
            cluster = ComplaintCluster(
                representative_text=cluster_complaints[0].original_text,
                category=self._most_common_category(cluster_complaints),
                complaint_count=len(cluster_complaints),
                avg_severity=np.mean([c.severity or 50 for c in cluster_complaints]),
                # centroid = average location
                centroid=self._calculate_centroid(cluster_complaints),
            )
            db.add(cluster)
            await db.flush()  # Get cluster.id

            # Assign complaints to cluster
            for c in cluster_complaints:
                c.cluster_id = cluster.id
                complaints_clustered += 1

            clusters_created += 1

        await db.commit()
        return {"clusters_created": clusters_created, "complaints_clustered": complaints_clustered}

    async def find_similar(self, complaint_id: UUID, db: AsyncSession, limit: int = 10) -> list:
        """Find complaints similar to a given complaint."""
        complaint = await get_complaint(complaint_id, db)
        embedding = await self.embedding_service.get_embedding(complaint.original_text)

        # Compare with other complaints in same category
        similar_complaints = await get_complaints_by_category(complaint.category, db)
        # ... compute similarity, return top matches
```

---

### 10. Copilot Service (`services/copilot_service.py`)

```python
"""
Government AI Copilot with function/tool calling.
Uses Gemini 2.5 Flash to answer officer questions using real database data.
"""

class CopilotService:
    def __init__(self):
        self.gemini = GeminiClient()

    async def query(self, query: str, db: AsyncSession, user_id: UUID,
                    conversation_id: str | None = None) -> dict:
        """
        Process an officer's query using Gemini with function calling.

        Flow:
        1. Send query + tool definitions to Gemini
        2. Gemini decides which tool(s) to call
        3. Execute tool calls against real database
        4. Send results back to Gemini
        5. Gemini generates human-readable response
        6. Log interaction
        7. Return response + tool calls for UI display
        """
        # Define available tools
        tools = self._get_tool_definitions()

        # Build messages
        messages = [{"role": "user", "content": query}]

        # Call Gemini with function calling
        response = await self.gemini.chat_with_tools(
            messages=messages,
            tools=tools,
            system_prompt=COPILOT_SYSTEM_PROMPT
        )

        # Execute any tool calls
        tool_results = []
        if response.get("tool_calls"):
            for tool_call in response["tool_calls"]:
                result = await self._execute_tool(tool_call["name"], tool_call["args"], db)
                tool_results.append({
                    "tool_name": tool_call["name"],
                    "arguments": tool_call["args"],
                    "result": result
                })

            # Send tool results back to Gemini for final response
            final_response = await self._get_final_response(
                query, tool_results, messages
            )
        else:
            final_response = response.get("response_text", "I couldn't process that query.")

        # Log interaction
        interaction = AIInteraction(
            user_id=user_id,
            interaction_type="copilot",
            query=query,
            response=final_response,
            tool_calls=tool_results,
            model_used="gemini-2.5-flash",
        )
        db.add(interaction)
        await db.commit()

        return {
            "response": final_response,
            "tool_calls": tool_results,
            "conversation_id": conversation_id or str(uuid4())
        }

    async def _execute_tool(self, tool_name: str, args: dict, db: AsyncSession) -> dict:
        """Execute a copilot tool against the real database."""
        tool_map = {
            "get_top_priority_areas": self._tool_get_top_priority_areas,
            "get_priority_area_details": self._tool_get_priority_area_details,
            "get_complaint_cluster": self._tool_get_complaint_cluster,
            "get_area_statistics": self._tool_get_area_statistics,
            "get_complaint_details": self._tool_get_complaint_details,
            "get_project_options": self._tool_get_project_options,
            "get_project_impact": self._tool_get_project_impact,
            "get_trending_issues": self._tool_get_trending_issues,
        }

        if tool_name not in tool_map:
            return {"error": f"Unknown tool: {tool_name}"}

        return await tool_map[tool_name](args, db)

    # ---- Tool implementations (query real database) ----

    async def _tool_get_top_priority_areas(self, args, db):
        limit = args.get("limit", 5)
        category = args.get("category")
        # Query priority_scores table, join with wards
        # Return top N areas by total_score
        ...

    async def _tool_get_priority_area_details(self, args, db):
        ward_id = args["ward_id"]
        # Query priority_scores for this ward
        # Include: score breakdown, top issues, complaint count, population
        ...

    async def _tool_get_complaint_cluster(self, args, db):
        cluster_id = args["cluster_id"]
        # Query cluster + its complaints
        ...

    async def _tool_get_area_statistics(self, args, db):
        ward_id = args["ward_id"]
        # Query: complaint count, avg severity, population, infrastructure score
        # Group by category
        ...

    async def _tool_get_complaint_details(self, args, db):
        complaint_id = args["complaint_id"]
        # Full complaint with analysis, evidence summary
        ...

    async def _tool_get_project_options(self, args, db):
        budget = args.get("budget")
        ward_id = args.get("ward_id")
        # Find priority areas within budget
        # Suggest projects with cost estimates
        ...

    async def _tool_get_project_impact(self, args, db):
        project_id = args["project_id"]
        # Get impact measurement for this project
        ...

    async def _tool_get_trending_issues(self, args, db):
        days = args.get("days", 30)
        # Compare complaint volume this period vs previous period
        # Return categories with increasing/decreasing trends
        ...
```

---

### 11. Copilot Tool Definitions (`ai/tools.py`)

```python
"""
Tool definitions for Gemini function calling.
These tell Gemini what functions are available and their parameters.
"""

COPILOT_TOOLS = [
    {
        "name": "get_top_priority_areas",
        "description": "Get the top priority areas ranked by civic need score. Use this when the officer asks about urgent areas, priorities, or which areas need attention.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Number of top areas to return", "default": 5},
                "category": {"type": "string", "description": "Filter by problem category (e.g., 'Road Infrastructure')"}
            }
        }
    },
    {
        "name": "get_priority_area_details",
        "description": "Get detailed priority breakdown for a specific ward. Use this when the officer asks WHY an area is ranked high or wants details about a specific ward.",
        "parameters": {
            "type": "object",
            "properties": {
                "ward_id": {"type": "integer", "description": "The ward ID to get details for"}
            },
            "required": ["ward_id"]
        }
    },
    {
        "name": "get_complaint_cluster",
        "description": "Get details about a group of similar complaints. Use when the officer asks about related complaints or complaint patterns.",
        "parameters": {
            "type": "object",
            "properties": {
                "cluster_id": {"type": "string", "description": "The cluster UUID"}
            },
            "required": ["cluster_id"]
        }
    },
    {
        "name": "get_area_statistics",
        "description": "Get comprehensive statistics for a ward including complaint counts, severity, demographics, and infrastructure data.",
        "parameters": {
            "type": "object",
            "properties": {
                "ward_id": {"type": "integer", "description": "The ward ID"}
            },
            "required": ["ward_id"]
        }
    },
    {
        "name": "get_complaint_details",
        "description": "Get full details of a specific complaint including AI analysis and evidence.",
        "parameters": {
            "type": "object",
            "properties": {
                "complaint_id": {"type": "string", "description": "The complaint UUID"}
            },
            "required": ["complaint_id"]
        }
    },
    {
        "name": "get_project_options",
        "description": "Get possible project interventions based on budget and area. Use when the officer asks about what they can do with a specific budget, or asks for project recommendations.",
        "parameters": {
            "type": "object",
            "properties": {
                "budget": {"type": "number", "description": "Available budget in INR"},
                "ward_id": {"type": "integer", "description": "Optional: specific ward"},
                "category": {"type": "string", "description": "Optional: specific category"}
            }
        }
    },
    {
        "name": "get_project_impact",
        "description": "Get the impact measurement for a completed project, including resolution score and citizen feedback.",
        "parameters": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string", "description": "The project UUID"}
            },
            "required": ["project_id"]
        }
    },
    {
        "name": "get_trending_issues",
        "description": "Get trending civic issues - categories where complaints are increasing or decreasing. Use when the officer asks about trends or what's getting worse/better.",
        "parameters": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Number of days to analyze", "default": 30}
            }
        }
    }
]
```

---

### 12. Simulation Service (`services/simulation_service.py`)

```python
"""
What-If Budget Simulator — Phase 4 feature.
Deterministic scoring, NOT LLM-generated numbers.
"""

class SimulationService:
    async def simulate_budget(self, budget: float, db: AsyncSession,
                               ward_id: int | None = None,
                               category: str | None = None) -> dict:
        """
        Given a budget, return ranked project options with estimated impact.

        Logic:
        1. Get priority areas matching filters
        2. For each area, estimate project cost (from historical data or formula)
        3. Calculate impact_estimate = priority_score * population_factor / cost
        4. Rank by cost_efficiency
        5. Return top options within budget
        """
        priority_areas = await get_priority_areas(db, ward_id, category)

        options = []
        for area in priority_areas:
            estimated_cost = self._estimate_cost(area)
            if estimated_cost > budget:
                continue

            impact = self._calculate_impact_estimate(area)
            cost_efficiency = impact / (estimated_cost / 10_000_000)  # per crore

            options.append({
                "title": f"{area.category} improvement in {area.ward_name}",
                "category": area.category,
                "estimated_cost": estimated_cost,
                "affected_population": area.population,
                "priority_score": area.total_score,
                "impact_estimate": round(impact, 1),
                "cost_efficiency": round(cost_efficiency, 1),
            })

        options.sort(key=lambda x: x["cost_efficiency"], reverse=True)

        recommendation = options[0]["title"] if options else "No suitable projects within budget"

        return {
            "options": options[:10],
            "recommendation": recommendation,
            "disclaimer": "Prototype simulation — estimated impact only"
        }
```

---

## BUILD TIMELINE (YOUR HOURS)

| Hour | What to Build |
|------|--------------|
| **0-1** | Set up `ai/` directory, install deps, create `gemini_client.py` + `groq_client.py`, test API connections |
| **1-2** | Write `prompts.py` (all prompt templates), write `ai/schemas.py` (Pydantic validation models) |
| **2-3** | Build `analysis_service.py` — full pipeline: text → Gemini → validated JSON → return |
| **3-4** | Build `speech_service.py` + `api/voice.py` — Groq Whisper integration, test with Hindi audio |
| **4-5** | Build `image_service.py` — Gemini multimodal, test with a road damage photo |
| **5-6** | Integration test: connect analysis_service to Person A's analyze endpoint, verify end-to-end |
| **6-7** | Fix issues from integration, handle edge cases (empty text, non-image files, etc.) |
| **7-8** | **MERGE** — all AI services tested and working with Person A's backend |
| **8-9** | Build `embedding_service.py` — local sentence-transformers, test embeddings |
| **9-10** | Build `cluster_service.py` — DBSCAN clustering, test with sample complaints |
| **10-11** | Build `ai/tools.py` (tool definitions) + start `copilot_service.py` |
| **11-12** | Complete `copilot_service.py` — wire tool calls to real DB queries |
| **12-13** | Test copilot end-to-end: ask questions, verify tool calls return real data |
| **13-14** | **MERGE** — clustering + copilot integrated |
| **14-16** | Build recommendation logic: complaint patterns → project suggestions |
| **16-18** | Refine all AI services, fix bugs, improve prompts based on actual outputs |
| **18-19** | **MERGE** — all Phase 3 AI features integrated |
| **19-20** | Build `simulation_service.py` (what-if budget) |
| **20-21** | Build root cause analysis service |
| **21-22** | Test all AI features, pre-cache demo responses |
| **22-24** | Final testing, help with deployment, demo rehearsal |

---

## COORDINATION WITH TEAMMATES

### What Person A (Backend) provides you:
- SQLAlchemy models (you import `from app.models.complaint import Complaint`)
- Database session dependency (`from app.api.deps import get_db`)
- The `POST /api/complaints/{id}/analyze` endpoint that calls YOUR `analysis_service`
- Config with your env vars (GEMINI_API_KEY, GROQ_API_KEY, EMBEDDING_PROVIDER)

### What Person B (Frontend) needs from you (via backend):
- Analysis results in the JSON schema defined above
- Copilot responses with tool_calls array visible
- Voice transcription results

### How Person A calls your code:
```python
# In Person A's api/complaints.py:
from app.services.analysis_service import AnalysisService

@router.post("/api/complaints/{id}/analyze")
async def analyze_complaint(id: UUID, db = Depends(get_db)):
    service = AnalysisService()
    result = await service.analyze_complaint(id, db)
    return result
```

### Your API routes:
You register these in `api/voice.py` and `api/copilot.py`. Tell Person A to include your routers in `main.py`:
```python
# Person A adds to main.py:
from app.api import voice, copilot
app.include_router(voice.router, tags=["voice"])
app.include_router(copilot.router, tags=["copilot"])
```

---

## CRITICAL RULES

1. **NEVER let LLM invent database facts** — copilot MUST use tool calling for data queries
2. **ALL AI outputs must be validated by Pydantic** — never trust raw LLM JSON
3. **Every AI call must have timeout + retry + fallback** — Gemini fails → try Groq → return error gracefully
4. **Never send citizen PII (name, phone, email) to LLM APIs** — only send complaint text and category
5. **Severity scores from AI are 1-100 integers** — validate the range
6. **Use `response_mime_type="application/json"` for Gemini** — forces JSON output
7. **Cache the sentence-transformers model** — load once, reuse (lazy singleton)
8. **Log all AI interactions** — model used, tokens, query, response (for debugging and audit)
9. **Root cause language must say "possible"** — never "confirmed" or "proven"
10. **Impact scores must have `is_estimated: True`** — always, no exceptions
