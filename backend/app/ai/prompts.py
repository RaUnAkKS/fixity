"""
AI Prompt Templates and Output Schemas
======================================
Contains system prompts and JSON schemas for:
- Complaint text analysis (categorization, severity scoring, issue extraction)
- Multimodal photo evidence analysis
- AI Copilot system prompt and instructions
- Root cause analysis
- Citizen verification comparison
"""

# =====================================================================
# 1. Complaint Text Analysis Prompt & Schema
# =====================================================================

COMPLAINT_ANALYSIS_PROMPT = """You are a civic complaint analyst for an Indian government platform.

Analyze the following citizen complaint and extract structured information.

RULES:
1. Detect the language of the input text (return ISO 639-1 code).
2. If the text is not in English, provide an accurate English translation in translated_text.
3. Classify into EXACTLY one of these categories:
   - Road Infrastructure
   - Water Supply
   - Drainage & Sewage
   - Sanitation & Waste
   - Electricity
   - Healthcare
   - Education
   - Public Transport
   - Parks & Recreation
   - Building & Construction
   - Pollution
   - Public Safety
   - Other
4. Assign a severity integer score from 1 (minor inconvenience) to 100 (critical emergency):
   - 1-20: Minor cosmetic issue / slight inconvenience
   - 21-40: Moderate inconvenience / non-urgent maintenance
   - 41-60: Significant problem affecting daily life or mobility
   - 61-80: Serious hazard affecting health, sanitation, or safety
   - 81-100: Critical emergency requiring immediate intervention
5. Extract specific issues mentioned as a concise list of strings.
6. Identify if there is a possible related underlying issue not explicitly stated.
7. Suggest the responsible government department (e.g. 'Public Works Department', 'Municipal Corporation Sanitation Wing', 'Water Supply & Sewerage Board', 'Electricity Board').
8. Provide a clear, objective summary in English (1-2 sentences).

Citizen complaint:
{complaint_text}
"""

COMPLAINT_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "detected_language": {
            "type": "string",
            "description": "ISO 639-1 language code (e.g. 'en', 'hi', 'bn', 'ta', 'mr')"
        },
        "translated_text": {
            "type": "string",
            "description": "English translation if the complaint was in another language, or null/empty if already English"
        },
        "category": {
            "type": "string",
            "enum": [
                "Road Infrastructure",
                "Water Supply",
                "Drainage & Sewage",
                "Sanitation & Waste",
                "Electricity",
                "Healthcare",
                "Education",
                "Public Transport",
                "Parks & Recreation",
                "Building & Construction",
                "Pollution",
                "Public Safety",
                "Other"
            ]
        },
        "subcategory": {
            "type": "string",
            "description": "Specific sub-problem (e.g. 'Pothole', 'Water Contamination', 'Open Drain', 'Streetlight')"
        },
        "severity": {
            "type": "integer",
            "description": "Severity rating integer from 1 (minor) to 100 (critical emergency)"
        },
        "issues": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Key granular issues extracted from complaint"
        },
        "possible_related_issue": {
            "type": "string",
            "description": "Underlying or secondary civic issue that might be contributing"
        },
        "suggested_department": {
            "type": "string",
            "description": "Recommended government department to handle this"
        },
        "summary": {
            "type": "string",
            "description": "Concise English executive summary of the issue"
        }
    },
    "required": [
        "detected_language",
        "category",
        "severity",
        "issues",
        "suggested_department",
        "summary"
    ]
}


# =====================================================================
# 2. Image Multimodal Evidence Analysis Prompt & Schema
# =====================================================================

IMAGE_ANALYSIS_PROMPT = """You are analyzing a photo submitted by a citizen as evidence of a civic infrastructure problem.

Context: The citizen reported: "{complaint_text}"

Analyze the image and identify:
1. What civic infrastructure issues are visible (e.g., potholes, waterlogging, garbage accumulation, broken pipes, exposed wiring, damaged footpath).
2. Estimated severity score (1-100) based strictly on visible damage or hazard.
3. A brief, factual description of what is visible in the photo.
4. Confidence level in the assessment ('high', 'medium', 'low').
5. Whether the photo is actually relevant to a civic infrastructure issue (true/false).

CRITICAL RULES:
- Be strictly factual. Only describe what is genuinely visible.
- If the image is blurry, irrelevant, or does not depict civic infrastructure, set is_relevant to false and note this in description.
"""

IMAGE_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "detected_issues": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of visible issues in the image"
        },
        "severity_estimate": {
            "type": "integer",
            "description": "Estimated severity integer from 1 to 100 based on visual evidence"
        },
        "description": {
            "type": "string",
            "description": "Factual description of visible scene"
        },
        "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"]
        },
        "is_relevant": {
            "type": "boolean",
            "description": "Whether the photo depicts genuine civic issues"
        }
    },
    "required": [
        "detected_issues",
        "severity_estimate",
        "description",
        "confidence",
        "is_relevant"
    ]
}


# =====================================================================
# 3. Government AI Copilot System Prompt
# =====================================================================

COPILOT_SYSTEM_PROMPT = """You are CivicAI Government Copilot — an AI decision intelligence assistant for municipal administrators, engineers, and government officers managing civic infrastructure.

You have access to tools that query the CivicAI database. ALWAYS use these tools to answer questions about:
- Priority areas, complaint data, ward statistics, and demographic demand
- Project options, budget simulations, and impact measurements
- Complaint clusters, recurring patterns, and trending issues

RULES:
1. NEVER make up data or numbers. If information is unavailable, clearly state so.
2. ALWAYS call appropriate tools before answering questions that require data.
3. Use clear, professional, and authoritative language suitable for government decision-makers.
4. When discussing priorities, explain WHY an area is ranked high (break down demand, severity, population, and infrastructure gap).
5. When recommending projects, provide justification, estimated costs, and cost-efficiency.
6. Use Indian Rupee (₹) for currency. Format large amounts in Lakhs (₹L) or Crores (₹Cr).
7. When showing scores, explain what individual component weights represent.
8. Be structured, concise, and actionable in recommendations.
9. If asked about topics outside CivicAI civic data, politely respond: "I can only answer questions related to CivicAI municipal data and civic decision intelligence."
"""


# =====================================================================
# 4. Root Cause Analysis Prompt & Schema
# =====================================================================

ROOT_CAUSE_PROMPT = """You are analyzing complaint patterns and civic infrastructure data to identify potential systemic root causes.

Area: {ward_name} (Ward ID: {ward_id})
Category: {category}
Complaint Count: {complaint_count}
Average Severity: {avg_severity}
Common Issues Reported: {common_issues}
Co-occurring Problem Categories: {co_occurring}
Ward Infrastructure Context: {infrastructure_data}

Based on these patterns:
1. Identify possible root causes (use cautious language — "potential contributing factor", "possible systemic issue").
2. Assign confidence ('high', 'medium', 'low') and provide supporting evidence for each cause.
3. Recommend a targeted long-term intervention that addresses the underlying cause rather than short-term symptoms.
4. Include a standard disclaimer.

CRITICAL RULE:
Do NOT state root causes as absolute facts or certified engineering conclusions. Frame them as probabilistic data-driven hypotheses.
"""

ROOT_CAUSE_SCHEMA = {
    "type": "object",
    "properties": {
        "possible_causes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "cause": {
                        "type": "string",
                        "description": "Potential root cause description"
                    },
                    "confidence": {
                        "type": "string",
                        "enum": ["high", "medium", "low"]
                    },
                    "evidence": {
                        "type": "string",
                        "description": "Data points or complaint correlations supporting this hypothesis"
                    }
                },
                "required": ["cause", "confidence", "evidence"]
            }
        },
        "recommended_intervention": {
            "type": "string",
            "description": "Strategic, sustainable engineering or municipal intervention"
        },
        "disclaimer": {
            "type": "string",
            "description": "Mandatory disclaimer on simulated/estimated findings"
        }
    },
    "required": [
        "possible_causes",
        "recommended_intervention",
        "disclaimer"
    ]
}


# =====================================================================
# 5. Verification Assessment Prompt & Schema
# =====================================================================

VERIFICATION_ASSESSMENT_PROMPT = """You are assessing a citizen's resolution verification for a civic complaint.

Complaint Summary: {complaint_summary}
Resolved Status Reported: {is_resolved}
Citizen Rating (1-5): {rating}
Citizen Feedback Comment: "{citizen_comment}"
Photo Evidence Analysis: {photo_analysis}

Evaluate whether the citizen's verification confirms the issue was resolved properly.
Classify resolution outcome as:
- 'matches': Verification confirms successful resolution.
- 'partial': Work was done but issue is only partially resolved or sub-standard.
- 'mismatch': Citizen indicates work was NOT done or failed completely.

Provide an explanation and a resolution score from 0.0 to 1.0.
"""

VERIFICATION_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "verification_status": {
            "type": "string",
            "enum": ["matches", "partial", "mismatch"]
        },
        "resolution_score": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 1.0
        },
        "explanation": {
            "type": "string"
        }
    },
    "required": ["verification_status", "resolution_score", "explanation"]
}
