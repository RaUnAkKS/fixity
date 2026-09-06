'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  CopilotAction,
  CopilotBriefingResponse,
  CopilotChatMessage,
  CopilotChatResponse,
  CopilotSuggestionItem,
} from '@/lib/types';
import {
  Sparkles,
  Send,
  Loader2,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  FileText,
  Clock,
  Shield,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

// Dynamic import for Leaflet MapView to prevent SSR errors
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2 min-h-[400px]">
      <Loader2 className="h-7 w-7 text-blue-700 animate-spin" />
      <span className="text-xs font-semibold">Synchronizing Spatial Intelligence Map...</span>
    </div>
  ),
});

interface ChatMessageEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  key_findings?: string[];
  recommendations?: string[];
  actions?: CopilotAction[];
  suggested_followups?: string[];
  timestamp: string;
}

export default function GovernmentCopilotPage() {
  const [messages, setMessages] = useState<ChatMessageEntry[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Welcome to **CivicAI Government Copilot**. I am connected to the municipal database with real-time PostGIS spatial layers, citizen confirmations, and departmental workload metrics.\n\nHow can I assist your operational decisions today?',
      key_findings: [
        'Real-time grounding active across all 20 municipal wards',
        'Citizen community confirmations aggregated for priority weighting',
      ],
      recommendations: [
        'Review current high-priority crisis areas across city sectors',
        'Check citizen post-resolution verification audit scores',
      ],
      suggested_followups: [
        'What are the top priority crisis areas in the city today?',
        'Analyze the root cause of recurring water supply complaints in Ward 4',
        'Simulate allocating ₹25 Lakhs to repair road infrastructure in Ward 4',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CopilotSuggestionItem[]>([]);
  const [briefing, setBriefing] = useState<CopilotBriefingResponse | null>(null);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Delhi Central
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [activeWardId, setActiveWardId] = useState<number | null>(4);
  const [focusedLocationName, setFocusedLocationName] = useState<string>('Delhi NCR Municipal Region');
  const [hotspots, setHotspots] = useState<Array<{ lat: number; lng: number; weight: number }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load suggestions on mount
  useEffect(() => {
    async function loadSuggestions() {
      try {
        const data = await api.get<CopilotSuggestionItem[]>('/api/copilot/suggestions');
        if (data && Array.isArray(data)) {
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    }
    loadSuggestions();
  }, []);

  // Load complaints to seed initial map hotspots
  useEffect(() => {
    async function loadMapHotspots() {
      try {
        const res = await api.get<any>('/api/complaints?limit=80');
        const items = res?.items || (Array.isArray(res) ? res : []);
        const valid = items
          .filter((c: any) => c.latitude != null && c.longitude != null)
          .map((c: any) => ({
            lat: Number(c.latitude),
            lng: Number(c.longitude),
            weight: c.severity ? c.severity / 100 : 0.6,
          }));
        setHotspots(valid);
      } catch (err) {
        console.error('Failed to load initial map hotspots:', err);
      }
    }
    loadMapHotspots();
  }, []);

  // Handle Fetching Morning Briefing
  const handleFetchBriefing = async () => {
    setBriefingLoading(true);
    setShowBriefingModal(true);
    try {
      const data = await api.get<CopilotBriefingResponse>('/api/copilot/briefing');
      setBriefing(data);
    } catch (err) {
      console.error('Failed to fetch morning briefing:', err);
    } finally {
      setBriefingLoading(false);
    }
  };

  // Execute a chat query
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessageEntry = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      // Build conversation history format
      const history: CopilotChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post<CopilotChatResponse>('/api/copilot/chat', {
        query: textToSend,
        ward_id: activeWardId,
        conversation_history: history,
      });

      if (res) {
        const assistantMsg: ChatMessageEntry = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: res.answer,
          key_findings: res.key_findings,
          recommendations: res.recommendations,
          actions: res.actions,
          suggested_followups: res.suggested_followups,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Process UI Actions (e.g. Map fly-to)
        if (res.actions && res.actions.length > 0) {
          const mapAction = res.actions.find((a) => a.type === 'FOCUS_MAP');
          if (mapAction && mapAction.latitude && mapAction.longitude) {
            setMapCenter([mapAction.latitude, mapAction.longitude]);
            setMapZoom(mapAction.zoom || 14);
            if (mapAction.ward_id) {
              setActiveWardId(mapAction.ward_id);
              setFocusedLocationName(`Ward ${mapAction.ward_id}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Copilot chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            'I encountered a temporary communication issue connecting to the reasoning pipeline. Ground-truth database fallback is active. Please retry your civic query.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Government AI Copilot</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                CivicAI Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              From Citizen Voice to Verified Impact • Grounded Municipal Decision Workbench
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleFetchBriefing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Activity className="h-4 w-4 text-blue-400" />
            Executive Morning Briefing
          </button>
        </div>
      </div>

      {/* Main Split-Screen Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Console: Conversational Agent (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-[700px]">
          {/* Console Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">Copilot Reasoning Stream</span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium">
              Deterministic Tools • Gemini & Groq Llama 3.3
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-700 text-white shadow-xs rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs'
                  }`}
                >
                  {/* Message Body */}
                  <div className="whitespace-pre-line leading-relaxed font-medium">
                    {msg.content}
                  </div>

                  {/* Key Findings Card (Assistant Only) */}
                  {msg.key_findings && msg.key_findings.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                        <Activity className="h-3.5 w-3.5 text-blue-600" />
                        Key Operational Findings
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-600">
                        {msg.key_findings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations Card (Assistant Only) */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Recommended Interventions
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-[11px] text-emerald-900">
                        {msg.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Trigger Badge */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 w-fit">
                      <MapPin className="h-3 w-3" />
                      Map synchronized to focused coordinates
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Suggested Inquiries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggested_followups.map((followup, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(followup)}
                            className="text-[11px] text-left px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-slate-700 transition-colors border border-slate-200/60 cursor-pointer"
                          >
                            {followup}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[9px] text-right font-medium ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-600'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 shadow-xs flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-blue-700 animate-spin" />
                  <span>Querying deterministic tools & PostGIS layers...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Pills */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] font-bold text-slate-600 shrink-0">Prompts:</span>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug.query)}
                className="shrink-0 px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                {sug.title}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-3.5 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about priority hotspots, root causes, budget ROI, or dispatch drafts..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Console: Synchronized GIS Spatial Intelligence (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Spatial Map View */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-700" />
                <h3 className="text-xs font-bold text-slate-900">Synchronized Spatial Map</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {focusedLocationName}
              </span>
            </div>

            <div className="flex-1 min-h-[360px] rounded-xl overflow-hidden border border-slate-200">
              <MapView
                center={mapCenter}
                zoom={mapZoom}
                hotspots={hotspots}
                height="100%"
              />
            </div>

            {/* Quick Map Controls & Stats */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-600 block">Focused Ward</span>
                <span className="text-xs font-black text-slate-900">
                  {activeWardId ? `Ward ${activeWardId}` : 'Citywide'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-600 block">Active Hotspots</span>
                <span className="text-xs font-black text-blue-700">{hotspots.length} Plotted</span>
              </div>
            </div>
          </div>

          {/* Quick Operations Links */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Connected Officer Workflows
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/dashboard/heatmap"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/70 font-bold transition-colors"
              >
                <span>Full City Heatmap</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/dashboard/clusters"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/70 font-bold transition-colors"
              >
                <span>Issue Clusters</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/dashboard/complaints"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/70 font-bold transition-colors"
              >
                <span>Complaints Ledger</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <button
                onClick={() => handleSendMessage('What is our citizen verification score and resolution satisfaction rate?')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/70 font-bold transition-colors text-left cursor-pointer"
              >
                <span>Citizen Verification</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Morning Briefing Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Executive Morning Operations Briefing
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {briefing?.generated_at || 'Instant Ground-Truth Intelligence'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBriefingModal(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {briefingLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                <span className="text-xs font-semibold">Aggregating citywide operational status...</span>
              </div>
            ) : briefing ? (
              <div className="space-y-4 text-xs">
                {/* Headline Banner */}
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                      {briefing.headline}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      briefing.priority_level === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {briefing.priority_level} Alert
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{briefing.summary}</p>
                </div>

                {/* Critical Alerts List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Top Priority Hotspots Today
                  </h4>
                  {briefing.critical_alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{alert.ward_name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md font-semibold">
                            {alert.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{alert.summary}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-red-600 block">
                          Avg Sev {alert.avg_severity}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {alert.community_confirmations} Confirmations
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Citizen Trust / Resolution Health */}
                {briefing.citizen_trust_metric && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-950 text-xs">Citizen Resolution Verification Score</span>
                      <p className="text-[11px] text-emerald-800">
                        {briefing.citizen_trust_metric.citizen_satisfaction_percent}% verified satisfaction rate across recent fixes
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-700">
                        {briefing.citizen_trust_metric.average_citizen_rating} / 5.0
                      </span>
                      <span className="text-[10px] text-emerald-600 block font-bold">
                        Trust: {briefing.citizen_trust_metric.trust_index}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowBriefingModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
