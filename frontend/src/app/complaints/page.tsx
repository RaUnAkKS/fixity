'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getStatusColor, getStatusLabel, getSeverityLabel, getSeverityColor, getCategoryLabel, formatDate } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import {
  PlusCircle,
  Search,
  FileSpreadsheet,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  ThumbsUp,
  Flame,
  Navigation,
  ArrowUpDown,
  Sparkles,
  Check,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  Layers,
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl bg-slate-100 border border-slate-200/80 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
      <Loader2 className="h-7 w-7 text-blue-700 animate-spin" />
      <span className="text-xs font-semibold">Rendering nearby incident heatmap...</span>
    </div>
  ),
});

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function ComplaintsPage() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'nearby' ? 'nearby' : 'my';
  const initialMode = searchParams.get('view_mode') === 'heatmap' ? 'heatmap' : 'list';
  
  const { user, isAuthenticated, isOfficer } = useAuth();
  const { language, t } = useLanguage();
  const geo = useGeolocation();

  const [activeTab, setActiveTab] = useState<'nearby' | 'my'>(initialView);
  const [nearbyMode, setNearbyMode] = useState<'list' | 'heatmap'>(initialMode);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'nearest' | 'newest'>('popular');

  // Upvote / Support State
  const [supportingId, setSupportingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const viewParam = searchParams.get('view');
    const modeParam = searchParams.get('view_mode');
    if (viewParam === 'nearby') {
      setActiveTab('nearby');
    } else if (viewParam === 'my') {
      setActiveTab('my');
    }
    if (modeParam === 'heatmap') {
      setNearbyMode('heatmap');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setLoading(true);
        setError('');
        
        let endpoint = '/api/complaints/my';
        if (activeTab === 'nearby') {
          const sortQuery = sortBy === 'popular' ? 'popular' : sortBy === 'newest' ? 'recent' : '';
          endpoint = `/api/complaints?page=1&limit=100${sortQuery ? `&sort_by=${sortQuery}` : ''}`;
        }

        const res = await api.get<any>(endpoint);
        setComplaints(res.items || res || []);
      } catch (err: any) {
        setError(err.message || (language === 'hi' ? 'समस्याएं लोड करने में विफल' : 'Failed to load issues'));
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, [activeTab, sortBy, language]);

  // Handle 1-Click Upvote / Support
  async function handleSupport(e: React.MouseEvent, complaintId: string, isAuthor: boolean, alreadyConfirmed: boolean) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setToastMsg({
        type: 'error',
        text: language === 'hi' ? 'समस्या का समर्थन करने के लिए कृपया लॉग इन करें।' : 'Please sign in to support this issue.',
      });
      return;
    }

    if (alreadyConfirmed) {
      return;
    }

    try {
      setSupportingId(complaintId);
      setToastMsg(null);

      const res = await api.post<any>(`/api/complaints/${complaintId}/confirm`);

      // Optimistically update list state
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === complaintId) {
            return {
              ...c,
              confirmation_count: res.confirmation_count ?? (c.confirmation_count || 0) + 1,
              community_signal: res.community_signal || c.community_signal,
              is_community_critical: res.is_community_critical ?? c.is_community_critical,
              user_has_confirmed: true,
            };
          }
          return c;
        })
      );

      setToastMsg({
        type: 'success',
        text: t('support_success_msg'),
      });
    } catch (err: any) {
      setToastMsg({
        type: 'error',
        text: err.message || 'Failed to support issue',
      });
    } finally {
      setSupportingId(null);
    }
  }

  // Filter & Sort list
  const processedComplaints = useMemo(() => {
    return complaints
      .map((c) => {
        let distance: number | null = null;
        if (geo.latitude && geo.longitude && c.latitude && c.longitude) {
          distance = calculateDistanceKm(geo.latitude, geo.longitude, c.latitude, c.longitude);
        }
        return { ...c, distance };
      })
      .filter((c) => {
        const matchesSearch =
          !search ||
          c.original_text?.toLowerCase().includes(search.toLowerCase()) ||
          c.category?.toLowerCase().includes(search.toLowerCase()) ||
          c.address?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return ['submitted', 'analyzing', 'analyzed', 'assigned', 'in_progress'].includes(c.status);
        if (statusFilter === 'resolved') return c.status === 'resolved';
        if (statusFilter === 'verified') return c.status === 'verified';
        return c.status === statusFilter;
      })
      .sort((a, b) => {
        if (activeTab === 'nearby' && sortBy === 'nearest') {
          if (a.distance != null && b.distance != null) {
            return a.distance - b.distance;
          }
          if (a.distance != null) return -1;
          if (b.distance != null) return 1;
        }
        if (activeTab === 'nearby' && sortBy === 'popular') {
          const confA = a.confirmation_count || 0;
          const confB = b.confirmation_count || 0;
          if (confB !== confA) return confB - confA;
          return (b.severity || 0) - (a.severity || 0);
        }
        // Default newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [complaints, search, statusFilter, sortBy, activeTab, geo.latitude, geo.longitude]);

  // Geospatial Hotspots & Incident Markers for Heatmap View
  const { hotspots, mapIncidents, mapCenter } = useMemo(() => {
    const valid = processedComplaints.filter(
      (c) => c.latitude != null && c.longitude != null
    );
    const spots = valid.map((c) => ({
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      weight: c.severity ? Math.max(0.2, c.severity / 100) : 0.5,
    }));
    const markers = valid.map((c) => ({
      id: c.id,
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      title: c.original_text,
      category: c.category,
      severity: c.severity,
      address: c.address,
    }));

    let center: [number, number] = [28.6475, 77.3150];
    if (geo.latitude && geo.longitude) {
      center = [geo.latitude, geo.longitude];
    } else if (valid.length > 0) {
      center = [Number(valid[0].latitude), Number(valid[0].longitude)];
    }

    return { hotspots: spots, mapIncidents: markers, mapCenter: center };
  }, [processedComplaints, geo.latitude, geo.longitude]);

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Toast Notification Banner */}
        {toastMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-sm ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === 'success' ? (
                <Sparkles className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header & Main Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'nearby' ? t('nearby_title') : t('complaints_title')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'nearby' ? t('nearby_subtitle') : t('complaints_subtitle')}
            </p>
          </div>
          <Link 
            href="/report" 
            className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-700/20 self-start sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            {t('btn_report_issue')}
          </Link>
        </div>

        {/* HERO COMPONENT: Prominent Institutional Civic Reputation Card */}
        {isAuthenticated && !isOfficer && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white border border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Your Civic Standing</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black">
                    {user?.civic_level || 'Active Citizen'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{user?.civic_reputation ?? 0}</span>
                  <span className="text-xs text-slate-300">points • Valid Reports (+5), Confirmations (+2), Verified Fixes (+5)</span>
                </div>
              </div>
            </div>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-colors shrink-0"
            >
              <span>View Profile Dossier</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* TOP TAB SWITCHER: Nearby Issues vs My Complaints */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl border border-slate-300/60 max-w-md">
          <button
            onClick={() => {
              setActiveTab('nearby');
              setToastMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'nearby'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4 text-blue-600" />
            <span>{t('tab_nearby_issues')}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('my');
              setToastMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            <span>{t('tab_my_complaints')}</span>
          </button>
        </div>

        {/* Nearby Sub-Switcher: List View vs Live Ward Heatmap */}
        {activeTab === 'nearby' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-200/60 rounded-2xl border border-slate-300/50">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNearbyMode('list')}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  nearbyMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                <span>List View ({processedComplaints.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setNearbyMode('heatmap')}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  nearbyMode === 'heatmap'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Ward Heatmap View ({mapIncidents.length} Pins)</span>
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline-block pr-3">
              Geospatial Incident Intelligence
            </span>
          </div>
        )}

        {/* Citizen Heatmap View */}
        {activeTab === 'nearby' && nearbyMode === 'heatmap' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-700" />
                  Ward Live Incident Heatmap
                </h2>
                <p className="text-xs text-slate-500">
                  Visualizing {mapIncidents.length} geotagged citizen grievances and municipal work sites.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200">
                  <span className="h-2 w-2 rounded-full bg-rose-600" /> Critical Hazard (&gt;65)
                </span>
                <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate (35-65)
                </span>
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                  <span className="h-2 w-2 rounded-full bg-blue-600" /> Routine (&lt;35)
                </span>
              </div>
            </div>

            <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-2xs relative">
              <MapView
                center={mapCenter}
                zoom={13}
                hotspots={hotspots}
                incidents={mapIncidents}
                height="100%"
              />
              <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm pointer-events-none">
                📍 Click pins to view incident details
              </div>
            </div>
          </div>
        )}

        {/* Search, Sorting & Status Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>

            {activeTab === 'nearby' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {t('sort_by_label')}:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                >
                  <option value="popular">{t('sort_most_supported')}</option>
                  <option value="nearest">{t('sort_nearest')}</option>
                  <option value="newest">{t('sort_newest')}</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-1 border-t border-slate-100 pt-2.5">
            {[
              { id: 'all', label: t('filter_all') },
              { id: 'active', label: t('filter_active') },
              { id: 'resolved', label: t('filter_resolved') },
              { id: 'verified', label: t('filter_verified') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
            <span className="text-xs text-slate-500">{t('loading_complaints')}</span>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('401')
                  ? (language === 'hi' ? 'लॉग इन आवश्यक है' : 'Authentication Required')
                  : (language === 'hi' ? 'शिकायतें लोड नहीं हो सकीं' : 'Unable to Load Issues')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('401')
                  ? (language === 'hi' ? 'अपनी दर्ज की गई शिकायतें देखने के लिए कृपया अपने खाते में लॉग इन करें।' : 'Please sign in to your account to view your registered grievances.')
                  : error}
              </p>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                {t('sign_in')}
              </Link>
            </div>
          </div>
        ) : processedComplaints.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('no_complaints_found')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? t('no_complaints_filter_match')
                : activeTab === 'nearby'
                ? t('no_nearby_issues_found')
                : t('no_complaints_registered_yet')}
            </p>
            {(!search && statusFilter === 'all') && (
              <div className="pt-2">
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <PlusCircle className="h-4 w-4" /> {t('btn_report_issue')}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {processedComplaints.map((c) => {
              const isAuthor = Boolean(user && user.id === c.citizen_id);
              const alreadyConfirmed = Boolean(c.user_has_confirmed);
              const supportsCount = c.confirmation_count || 0;

              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    {/* Left Details */}
                    <div className="space-y-2.5 flex-1">
                      
                      {/* Status, Category, Supports & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(c.status)}`}>
                          {getStatusLabel(c.status, language)}
                        </span>
                        
                        {c.category && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold">
                            {getCategoryLabel(c.category, language)}
                          </span>
                        )}

                        {c.severity != null && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityColor(c.severity)}`}>
                            {t('severity_prefix')} {c.severity} ({getSeverityLabel(c.severity, language)})
                          </span>
                        )}

                        {/* Supports / Upvote Pill */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          supportsCount >= 5
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : supportsCount > 0
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <ThumbsUp className="h-3 w-3 text-blue-600" />
                          <span>{supportsCount} {supportsCount === 1 ? t('supports_singular') : t('supports_label')}</span>
                        </span>

                        {c.parent_issue_id && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Users className="h-3 w-3 text-amber-600" />
                            <span>Linked to #{c.parent_issue_id.substring(0, 8)}</span>
                          </span>
                        )}

                        {(c.merged_reports_count || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span>+{c.merged_reports_count} Merged</span>
                          </span>
                        )}

                        {c.is_community_critical && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                            <Flame className="h-3 w-3 text-rose-600" />
                            {t('badge_community_critical')}
                          </span>
                        )}
                      </div>

                      {/* Issue Description */}
                      <Link href={`/complaints/${c.id}`} className="block group">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {c.original_text}
                        </p>
                      </Link>

                      {/* Location, Distance & Date Metadata */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                        {c.distance != null ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                            <Navigation className="h-3 w-3" />
                            <span>{c.distance} {t('distance_km')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{c.address || t('distance_unknown')}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatDate(c.created_at)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right Interactive Support Button & Detail Link */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      
                      {/* 1-Click UPVOTE / SUPPORT BUTTON */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isAuthor && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                            <Award className="h-3 w-3 text-blue-600" />
                            <span>{language === 'hi' ? 'आपकी रिपोर्ट' : 'Your Report'}</span>
                          </span>
                        )}

                        {alreadyConfirmed ? (
                          <button
                            disabled
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold cursor-default"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                            <span>{t('btn_supported')}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={supportingId === c.id}
                            onClick={(e) => handleSupport(e, c.id, isAuthor, alreadyConfirmed)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-700 border border-blue-200 hover:border-blue-700 text-xs font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {supportingId === c.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{t('btn_supporting')}</span>
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="h-3.5 w-3.5" />
                                <span>{t('btn_support_issue')}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Detail Link */}
                      <Link
                        href={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-700 transition-colors py-1 px-2 rounded-lg hover:bg-slate-50"
                      >
                        <span>{t('btn_view_case_file')}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                    </div>

                  </div>

                  {/* Live Officer Progress & Resolution Pipeline */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
                    {/* Stepper Mini-Bar */}
                    <div className="flex items-center justify-between text-center relative px-2">
                      {[
                        { key: 'submitted', label: t('stage_submitted') },
                        { key: 'analyzed', label: t('stage_triage') },
                        { key: 'assigned', label: t('stage_assigned') },
                        { key: 'in_progress', label: t('stage_in_progress') },
                        { key: 'resolved', label: t('stage_resolved') },
                        { key: 'verified', label: t('stage_verified') },
                      ].map((step, sIdx) => {
                        const statusOrder = ['submitted', 'analyzing', 'analyzed', 'assigned', 'in_progress', 'resolved', 'verified'];
                        const currentIndex = statusOrder.indexOf(c.status);
                        const isPast = statusOrder.indexOf(step.key) <= currentIndex && currentIndex !== -1;
                        const isCurrent = step.key === c.status || (step.key === 'analyzed' && c.status === 'analyzing');

                        return (
                          <div key={step.key} className="flex-1 flex flex-col items-center relative">
                            {sIdx !== 0 && (
                              <div
                                className={`absolute top-2.5 right-[50%] left-[-50%] h-0.5 -z-0 transition-colors ${
                                  isPast ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                              />
                            )}
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                                isPast
                                  ? 'bg-blue-700 text-white shadow-xs'
                                  : isCurrent
                                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 animate-pulse'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isPast ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : sIdx + 1}
                            </div>
                            <span
                              className={`text-[9px] font-bold mt-1 truncate max-w-[65px] ${
                                isCurrent ? 'text-blue-700 font-extrabold' : isPast ? 'text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contextual Officer Action Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="flex items-center gap-2">
                        {c.status === 'submitted' && (
                          <>
                            <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span className="text-slate-600">
                              {language === 'hi' ? 'शिकायत नगर निगम कतार में है। एआई विश्लेषण एवं विभाग आवंटन प्रक्रियाधीन है।' : 'Recorded in municipal queue. AI triage & department assignment in progress.'}
                            </span>
                          </>
                        )}
                        {(c.status === 'analyzing' || c.status === 'analyzed') && (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span className="text-slate-700">
                              {language === 'hi' ? 'एआई प्राथमिकीकरण पूर्ण। वार्ड रखरखाव विभाग को प्रेषित किया जा रहा है।' : 'AI triage complete. Priority assigned, routing to department crew.'}
                            </span>
                          </>
                        )}
                        {c.status === 'assigned' && (
                          <>
                            <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span className="text-purple-900 font-semibold">
                              {language === 'hi'
                                ? `विभाग आवंटित: ${c.ai_analysis?.suggested_department || c.category || 'नगर निगम रखरखाव विभाग'}`
                                : `Assigned to Dept: ${c.ai_analysis?.suggested_department || c.category || 'Municipal Maintenance Dept'}`}
                            </span>
                          </>
                        )}
                        {c.status === 'in_progress' && (
                          <>
                            <Wrench className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="text-amber-900 font-semibold">
                              {language === 'hi' ? 'मरम्मत कार्य प्रगति पर: नगर निगम फील्ड टीम स्थल पर कार्य कर रही है।' : 'Maintenance in progress: Municipal field crew is actively repairing on site.'}
                            </span>
                          </>
                        )}
                        {c.status === 'resolved' && (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-900 font-bold">
                              {language === 'hi' ? 'अधिकारी द्वारा समाधान पूर्ण: कृपया स्थल का निरीक्षण कर सत्यापन करें।' : 'Resolved by Department: Ready for your citizen verification audit.'}
                            </span>
                          </>
                        )}
                        {c.status === 'verified' && (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span className="text-teal-900 font-bold">
                              {language === 'hi' ? 'नागरिक द्वारा समाधान सत्यापित एवं आधिकारिक रूप से बंद।' : 'Resolution verified and closed by citizen.'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Direct 1-Click Verification Link if Resolved */}
                      {c.status === 'resolved' && !isOfficer && (
                        <Link
                          href={`/complaints/${c.id}/verify`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs whitespace-nowrap transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t('btn_verify_now')}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

