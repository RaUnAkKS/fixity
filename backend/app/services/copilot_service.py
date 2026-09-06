"""
CivicAI Government Copilot Service
==================================
Orchestrates AI reasoning on top of deterministic ground-truth civic tools.
Generates structured answers, key findings, recommendations, and interactive map actions.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.copilot_tools import CopilotTools, WARD_METADATA
from app.ai.gemini_client import GeminiClient
from app.ai.groq_client import GroqClient
from app.ai.prompts import COPILOT_SYSTEM_PROMPT
from app.schemas.copilot import (
    CopilotAction,
    CopilotBriefingResponse,
    CopilotChatMessage,
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotSuggestionItem,
    CriticalAlertItem,
)

logger = logging.getLogger(__name__)


class CopilotService:
    """Enterprise-grade Government AI Copilot Service for municipal decision makers."""

    def __init__(self):
        self.gemini = GeminiClient()
        self.groq = GroqClient()

    async def process_chat(
        self,
        request: CopilotChatRequest,
        db: AsyncSession,
    ) -> CopilotChatResponse:
        """Process natural language civic inquiry from government officer."""
        query_text = request.query.strip()
        q_lower = query_text.lower()
        target_ward = request.ward_id

        # Detect category in query if any
        detected_category = None
        for cat in ["water", "road", "pothole", "drainage", "sanitation", "electricity", "sewage", "garbage"]:
            if cat in q_lower:
                if cat in ["water", "sewage"]:
                    detected_category = "Water Supply" if cat == "water" else "Drainage & Sewage"
                elif cat in ["road", "pothole"]:
                    detected_category = "Road Infrastructure"
                elif cat in ["sanitation", "garbage"]:
                    detected_category = "Sanitation & Waste"
                elif cat == "electricity":
                    detected_category = "Electricity"
                break

        # Detect ward ID in query if mentioned (e.g. "ward 4", "ward 12")
        import re
        ward_match = re.search(r'\bward\s*(\d+)\b', q_lower)
        if ward_match:
            try:
                target_ward = int(ward_match.group(1))
            except ValueError:
                pass

        # ── 1. Tool Selection & Deterministic Data Fetch ──
        tool_data: Dict[str, Any] = {}
        tool_name = "get_top_priority_areas"
        actions: List[CopilotAction] = []
        key_findings: List[str] = []
        recommendations: List[str] = []

        if any(w in q_lower for w in ["budget", "allocate", "roi", "cost", "crore", "lakh", "simulate"]):
            tool_name = "simulate_budget_allocation"
            # Extract budget if mentioned
            amount = 25.0
            num_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|cr|crore)?', q_lower)
            if num_match:
                try:
                    val = float(num_match.group(1))
                    amount = val * 100 if "cr" in q_lower or "crore" in q_lower else val
                except ValueError:
                    amount = 25.0
            tool_data = await CopilotTools.simulate_budget_allocation(
                db, budget_amount=amount, target_ward=target_ward or 4, target_category=detected_category
            )
            ward_info = CopilotTools.get_ward_info(target_ward or 4)
            actions.append(CopilotAction(
                type="FOCUS_MAP",
                latitude=ward_info["lat"],
                longitude=ward_info["lng"],
                zoom=14,
                ward_id=target_ward or 4,
                metadata={"budget_allocation": tool_data["allocated_budget_inr"]}
            ))

        elif any(w in q_lower for w in ["root cause", "why", "failing", "underlying", "recurrent", "pattern"]):
            tool_name = "get_root_cause_analysis"
            tool_data = await CopilotTools.get_root_cause_analysis(
                db, ward_id=target_ward or 4, category=detected_category
            )
            ward_info = CopilotTools.get_ward_info(target_ward or 4)
            actions.append(CopilotAction(
                type="FOCUS_MAP",
                latitude=ward_info["lat"],
                longitude=ward_info["lng"],
                zoom=15,
                ward_id=target_ward or 4,
                category=tool_data.get("category"),
            ))

        elif any(w in q_lower for w in ["workload", "department", "officer", "backlog", "capacity", "pending"]):
            tool_name = "get_department_workload"
            workload_list = await CopilotTools.get_department_workload(db)
            tool_data = {"department_workload": workload_list}

        elif any(w in q_lower for w in ["cluster", "hotspot", "density", "geographic", "proximity"]):
            tool_name = "get_complaint_clusters"
            clusters = await CopilotTools.get_complaint_clusters(db, category=detected_category)
            tool_data = {"clusters": clusters}
            if clusters:
                c0 = clusters[0]
                actions.append(CopilotAction(
                    type="FOCUS_MAP",
                    latitude=c0["latitude"],
                    longitude=c0["longitude"],
                    zoom=15,
                    ward_id=c0["ward_id"],
                    highlight_complaint_ids=c0.get("complaint_ids", [])
                ))

        elif any(w in q_lower for w in ["underreported", "silent", "vulnerable", "hidden", "unheard"]):
            tool_name = "get_underreported_areas"
            underrep = await CopilotTools.get_underreported_areas(db)
            tool_data = {"underreported_areas": underrep}
            if underrep:
                u0 = underrep[0]
                actions.append(CopilotAction(
                    type="FOCUS_MAP",
                    latitude=u0["latitude"],
                    longitude=u0["longitude"],
                    zoom=14,
                    ward_id=u0["ward_id"],
                ))

        elif any(w in q_lower for w in ["verified", "verification", "satisfaction", "rating", "citizen trust", "audit"]):
            tool_name = "get_citizen_verification_summary"
            tool_data = await CopilotTools.get_citizen_verification_summary(db, ward_id=target_ward, category=detected_category)

        elif any(w in q_lower for w in ["dispatch", "draft", "work order", "order", "assign", "contractor"]):
            tool_name = "generate_work_order_draft"
            # Get latest complaints for dispatch
            recent = await CopilotTools.get_complaints_by_filter(db, category=detected_category, ward_id=target_ward, limit=5)
            cids = [r["id"] for r in recent]
            tool_data = await CopilotTools.generate_work_order_draft(db, complaint_ids=cids)

        elif target_ward is not None and not any(w in q_lower for w in ["all", "city", "top", "rank"]):
            tool_name = "get_ward_statistics"
            tool_data = await CopilotTools.get_ward_statistics(db, ward_id=target_ward)
            ward_info = CopilotTools.get_ward_info(target_ward)
            actions.append(CopilotAction(
                type="FOCUS_MAP",
                latitude=ward_info["lat"],
                longitude=ward_info["lng"],
                zoom=15,
                ward_id=target_ward,
            ))

        else:
            # Default to top priority areas
            tool_name = "get_top_priority_areas"
            top_areas = await CopilotTools.get_top_priority_areas(db, category=detected_category, limit=5)
            tool_data = {"top_priority_areas": top_areas}
            if top_areas:
                t0 = top_areas[0]
                actions.append(CopilotAction(
                    type="FOCUS_MAP",
                    latitude=t0["latitude"],
                    longitude=t0["longitude"],
                    zoom=14,
                    ward_id=t0["ward_id"],
                    highlight_complaint_ids=t0.get("complaint_ids", [])
                ))

        # ── 2. Synthesize Grounded Natural Language Response ──
        synthesis_prompt = f"""You are the CivicAI Government Copilot advising a municipal commissioner / officer.
The user asked: "{query_text}"

You executed tool '{tool_name}' and retrieved the following 100% GROUND-TRUTH CIVIC DATA:
```json
{json.dumps(tool_data, indent=2, default=str)}
```

INSTRUCTIONS:
1. Provide a professional, direct, executive synthesis answering the officer's query.
2. Cite exact numbers, ward names, and metrics from the ground-truth data.
3. Extract 2-3 concise 'Key Findings'.
4. Provide 2 clear, actionable 'Operational Recommendations' (e.g. dispatch teams, allocate resources, schedule inspections).
5. DO NOT hallucinate numbers or stats outside the provided JSON.

Format your response as a JSON object with this EXACT structure:
{{
  "answer": "Executive markdown answer paragraph with bullet points if helpful...",
  "key_findings": ["Finding 1...", "Finding 2..."],
  "recommendations": ["Recommendation 1...", "Recommendation 2..."],
  "suggested_followups": ["Followup question 1?", "Followup question 2?"]
}}
"""

        synthesized = None
        try:
            # Try Gemini primary synthesis
            res = await self.gemini.analyze_text(
                text=query_text,
                system_prompt=synthesis_prompt,
                response_schema={
                    "type": "object",
                    "properties": {
                        "answer": {"type": "string"},
                        "key_findings": {"type": "array", "items": {"type": "string"}},
                        "recommendations": {"type": "array", "items": {"type": "string"}},
                        "suggested_followups": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["answer", "key_findings", "recommendations", "suggested_followups"],
                }
            )
            synthesized = res
        except Exception as e:
            logger.warning("Gemini synthesis failed: %s. Trying Groq fallback...", e)
            try:
                # Groq fallback
                groq_res = await self.groq.chat_completion(
                    messages=[
                        {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                        {"role": "user", "content": synthesis_prompt},
                    ],
                    json_mode=True,
                )
                synthesized = json.loads(groq_res["content"])
            except Exception as e2:
                logger.warning("Groq synthesis failed: %s. Using deterministic fallback.", e2)
                synthesized = self._generate_deterministic_fallback(tool_name, tool_data, query_text)

        answer_text = synthesized.get("answer") or "Civic analytical data processed successfully."
        key_findings = synthesized.get("key_findings") or []
        recommendations = synthesized.get("recommendations") or []
        suggested_followups = synthesized.get("suggested_followups") or [
            "Show root cause analysis for this ward",
            "Simulate budget allocation impact",
            "Draft repair dispatch work order",
        ]

        return CopilotChatResponse(
            answer=answer_text,
            key_findings=key_findings,
            recommendations=recommendations,
            data=tool_data,
            sources=[{"tool": tool_name, "records_evaluated": len(tool_data) if isinstance(tool_data, list) else 1}],
            actions=actions,
            suggested_followups=suggested_followups,
        )

    async def generate_briefing(self, db: AsyncSession) -> CopilotBriefingResponse:
        """Generate an executive morning briefing on civic status."""
        top_areas = await CopilotTools.get_top_priority_areas(db, limit=3)
        workloads = await CopilotTools.get_department_workload(db)
        verif_summary = await CopilotTools.get_citizen_verification_summary(db)

        alerts: List[CriticalAlertItem] = []
        for area in top_areas:
            alerts.append(CriticalAlertItem(
                ward_id=area["ward_id"],
                ward_name=area["ward_name"],
                category=area["primary_category"],
                active_complaints=area["active_complaints"],
                avg_severity=area["avg_severity"],
                community_confirmations=area["total_confirmations"],
                urgency="Critical" if area["priority_score"] >= 65 else "Elevated",
                summary=f"{area['active_complaints']} active complaints with {area['total_confirmations']} citizen confirmations in {area['ward_name']} ({area['primary_category']}).",
            ))

        priority_level = "Critical" if any(a.urgency == "Critical" for a in alerts) else "Elevated"
        summary_text = (
            f"Municipal Overview: {len(alerts)} critical hotspots detected across the city. "
            f"{alerts[0].ward_name if alerts else 'Ward 4'} requires highest operational priority. "
            f"Citizen satisfaction rating currently at {verif_summary['average_citizen_rating']}/5.0 with {verif_summary['citizen_satisfaction_percent']}% verified fixes."
        )

        return CopilotBriefingResponse(
            headline="Municipal Operations Intelligence Briefing",
            priority_level=priority_level,
            summary=summary_text,
            critical_alerts=alerts,
            workload_summary={"departments": workloads[:3]},
            citizen_trust_metric=verif_summary,
            generated_at=datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC"),
        )

    @staticmethod
    def get_suggestions() -> List[CopilotSuggestionItem]:
        """Return curated quick query suggestions for municipal officers."""
        return [
            CopilotSuggestionItem(
                title="Top Priority Crisis Areas",
                query="What are the top priority crisis areas in the city today?",
                category="Prioritization",
                icon="AlertTriangle",
            ),
            CopilotSuggestionItem(
                title="Ward 4 Water Root Cause",
                query="Analyze the root cause of recurring water supply complaints in Ward 4",
                category="Diagnostic",
                icon="Activity",
            ),
            CopilotSuggestionItem(
                title="Simulate ₹25L Budget Impact",
                query="Simulate allocating ₹25 Lakhs to repair road infrastructure in Ward 4",
                category="Budgeting",
                icon="TrendingUp",
            ),
            CopilotSuggestionItem(
                title="Department Workload & Backlog",
                query="Show current department workload, open backlogs, and response bottlenecks",
                category="Operations",
                icon="Users",
            ),
            CopilotSuggestionItem(
                title="Silent / Underreported Zones",
                query="Which wards have low complaint volume but critical high severity issues?",
                category="Equity",
                icon="EyeOff",
            ),
            CopilotSuggestionItem(
                title="Citizen Verification Audit",
                query="What is our citizen verification score and resolution satisfaction rate?",
                category="Verification",
                icon="CheckCircle2",
            ),
        ]

    def _generate_deterministic_fallback(
        self,
        tool_name: str,
        tool_data: Dict[str, Any],
        query: str,
    ) -> Dict[str, Any]:
        """Fallback natural language generator when LLM providers are offline."""
        if tool_name == "get_top_priority_areas":
            top = tool_data.get("top_priority_areas", [])
            top_w = top[0] if top else {}
            return {
                "answer": f"**Top Priority Civic Crisis**: {top_w.get('ward_name', 'Ward 4')} ranks highest with **{top_w.get('active_complaints', 0)} active complaints**, an average severity of **{top_w.get('avg_severity', 0)}/100**, and **{top_w.get('total_confirmations', 0)} citizen confirmations**.",
                "key_findings": [
                    f"{top_w.get('ward_name')} has composite priority score of {top_w.get('priority_score', 0)}/100",
                    f"Primary affected sector: {top_w.get('primary_category', 'General')}",
                ],
                "recommendations": [
                    f"Mobilize rapid response maintenance crew to {top_w.get('ward_name')}.",
                    "Issue priority dispatch work order.",
                ],
                "suggested_followups": ["Show root cause analysis", "Simulate budget allocation"],
            }
        elif tool_name == "simulate_budget_allocation":
            return {
                "answer": f"**Budget Simulation Result**: An allocation of **{tool_data.get('allocated_budget_inr')}** to **{tool_data.get('ward_name')}** is projected to resolve **{tool_data.get('projected_issues_resolved')} complaints** and benefit **~{tool_data.get('estimated_citizens_benefited', 0):,} residents** with a severity reduction of **{tool_data.get('projected_severity_reduction')}**.",
                "key_findings": [
                    f"Estimated ROI score: {tool_data.get('estimated_roi_score')}",
                    f"Projected {tool_data.get('projected_issues_resolved')} bottlenecks resolved",
                ],
                "recommendations": [
                    f"Approve capital expenditure of {tool_data.get('allocated_budget_inr')} for {tool_data.get('ward_name')}.",
                ],
                "suggested_followups": ["Draft work order for this allocation", "Check other wards"],
            }
        return {
            "answer": f"Analysis complete for query: *{query}*. Evaluated ground-truth civic metrics.",
            "key_findings": ["Grounded data query executed successfully."],
            "recommendations": ["Review connected map actions and dispatch teams."],
            "suggested_followups": ["What are top priority areas?", "Show department workload"],
        }
