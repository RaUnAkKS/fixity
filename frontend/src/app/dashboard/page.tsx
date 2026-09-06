'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getStatusColor, getStatusLabel, getSeverityLabel, getSeverityColor, formatDate } from '@/lib/utils';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ArrowRight,
  TrendingUp,
  Shield,
  Loader2,
  AlertCircle,
  Map as MapIcon,
} from 'lucide-react';

interface DashboardSummary {
  total_complaints: number;
  active_complaints: number;
  high_priority_areas: number;
  pending_verifications: number;
  resolved_this_month: number;
}

interface CategoryTrend {
  category: string;
  count: number;
}

interface RecentComplaint {
  id: string;
  original_text: string;
  category: string | null;
  severity: number | null;
  status: string;
  created_at: string;
  address: string | null;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryTrend[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [summaryRes, trendsRes, complaintsRes] = await Promise.allSettled([
          api.get<DashboardSummary>('/api/dashboard/summary'),
          api.get<{ by_category?: CategoryTrend[] }>('/api/dashboard/trends'),
          api.get<{ items?: RecentComplaint[] }>('/api/complaints?page=1&limit=6'),
        ]);

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value);
        } else {
          setError('Failed to load dashboard summary');
        }

        if (trendsRes.status === 'fulfilled' && trendsRes.value?.by_category) {
          setCategories(trendsRes.value.by_category);
        }

        if (complaintsRes.status === 'fulfilled' && complaintsRes.value?.items) {
          setRecentComplaints(complaintsRes.value.items);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Municipal Operations Command</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time civic grievance telemetry, triage distribution, and department dispatching</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/complaints"
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-700/20 transition-all"
          >
            Manage Registry
          </Link>
          <Link
            href="/dashboard/heatmap"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <MapIcon className="h-3.5 w-3.5 text-slate-500" />
            Live Map
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Gathering municipal telemetry data...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('forbidden') || error.toLowerCase().includes('401') || error.toLowerCase().includes('403')
                ? 'Officer Authentication Required'
                : 'Dashboard Telemetry Unavailable'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('forbidden') || error.toLowerCase().includes('401') || error.toLowerCase().includes('403')
                ? 'Please sign in with officer or administrator credentials to access operations metrics.'
                : error}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Sign In as Officer
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">{summary?.total_complaints ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">All civic complaints logged</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Active Work Queue</span>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">{summary?.active_complaints ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Assigned or in progress</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">High Priority Wards</span>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">{summary?.high_priority_areas ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Critical severity (&gt;65)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resolved This Month</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">{summary?.resolved_this_month ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.pending_verifications ? `${summary.pending_verifications} awaiting audit` : 'All verified closed'}
              </p>
            </div>
          </div>

          {/* Category Breakdown & Operations Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Complaints by Department Category</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Automated AI distribution across municipal wards</p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">Active</span>
              </div>

              {categories.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No category breakdown data available yet.</p>
              ) : (
                <div className="space-y-3.5 pt-2">
                  {categories.map((cat, idx) => {
                    const total = summary?.total_complaints || 1;
                    const percent = Math.min(100, Math.round((cat.count / total) * 100));
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">{cat.category}</span>
                          <span className="text-slate-500">{cat.count} issues ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(6, percent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Operations Views */}
            <div className="space-y-3.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Operations Consoles</h2>

              <Link
                href="/dashboard/complaints"
                className="block p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Complaints Registry
                  </h3>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Review cases, update department workflow status, and inspect issues.</p>
              </Link>

              <Link
                href="/dashboard/heatmap"
                className="block p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Geospatial Heatmap
                  </h3>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Pinpoint high-density incident clusters across the municipal grid.</p>
              </Link>

              <Link
                href="/dashboard/clusters"
                className="block p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Issue Clusters
                  </h3>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Analyze recurring municipal patterns grouped by severity and category.</p>
              </Link>
            </div>
          </div>

          {/* Recent Live Complaints Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Recent Incident Feed</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live complaints streamed from citizens</p>
              </div>
              <Link
                href="/dashboard/complaints"
                className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>View Full Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentComplaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent complaints logged in the registry.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentComplaints.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        {item.category && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold">
                            {item.category}
                          </span>
                        )}
                        {item.severity != null && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityColor(item.severity)}`}>
                            Severity {item.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {item.original_text}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.address || 'Location recorded'} • {formatDate(item.created_at)}
                      </p>
                    </div>

                    <Link
                      href={`/complaints/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 whitespace-nowrap self-start sm:self-center"
                    >
                      <span>Inspect Case</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

