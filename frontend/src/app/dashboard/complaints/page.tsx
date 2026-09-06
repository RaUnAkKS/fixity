'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getStatusColor, getStatusLabel, getSeverityLabel, getSeverityColor, formatDate } from '@/lib/utils';
import { Search, Filter, ArrowRight, Loader2, AlertCircle, ShieldCheck, Check, Clock } from 'lucide-react';

interface ComplaintResponse {
  id: string;
  original_text: string;
  category: string;
  severity: number;
  status: string;
  confirmation_count?: number;
  community_signal?: string;
  community_signal_score?: number;
  is_community_critical?: boolean;
  created_at: string;
  address?: string;
  parent_issue_id?: string | null;
  merged_reports_count?: number;
  reporter_reputation?: number;
  reporter_name?: string;
}

export default function OfficerComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'severity' | 'newest'>('popular');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setLoading(true);
        setError(null);
        const sortQuery = sortBy === 'popular' ? 'popular' : sortBy === 'severity' ? 'severity' : '';
        const data = await api.get<any>(`/api/complaints?page=1&limit=100${sortQuery ? `&sort_by=${sortQuery}` : ''}`);
        if (data && Array.isArray(data.items)) {
          setComplaints(data.items);
        } else if (Array.isArray(data)) {
          setComplaints(data);
        } else {
          setComplaints([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch complaints', err);
        setError('Failed to load complaints registry.');
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, [sortBy]);

  async function handleQuickStatus(e: React.MouseEvent, complaintId: string, newStatus: string) {
    e.stopPropagation();
    try {
      setUpdatingId(complaintId);
      const res = await api.patch<any>(`/api/complaints/${complaintId}/status`, { status: newStatus });
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: res.status || newStatus } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.original_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['submitted', 'analyzing', 'analyzed', 'assigned', 'in_progress'].includes(c.status);
    if (statusFilter === 'resolved') return c.status === 'resolved';
    if (statusFilter === 'verified') return c.status === 'verified';
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Complaints Registry &amp; Triage</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Review active municipal grievances, citizen upvote signals, dispatch maintenance teams, and update lifecycle statuses</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by issue description, category, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
            >
              <option value="popular">Most Upvoted / High Priority</option>
              <option value="severity">Highest AI Severity</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-1 border-t border-slate-100 pt-2.5">
          {[
            { id: 'all', label: 'All Issues' },
            { id: 'active', label: 'Active Queue' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'verified', label: 'Verified' },
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
          <span className="text-xs text-slate-500">Loading complaints registry...</span>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <AlertCircle className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Unable to Load Registry</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Sign In as Officer
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          No complaints match the specified search query or filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Severity</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Community Supports &amp; Signal</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredComplaints.map((complaint) => (
                  <tr 
                    key={complaint.id} 
                    onClick={() => router.push(`/complaints/${complaint.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {complaint.id.substring(0, 8)}...
                    </td>
                    <td className="px-5 py-4 text-slate-900 max-w-xs font-bold truncate">
                      {complaint.original_text}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-semibold">
                      {complaint.category || 'Uncategorized'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full border ${
                        complaint.severity > 65 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        complaint.severity > 35 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {complaint.severity || 0}/100
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Affected Citizens / Confirmations Badge */}
                          <span className={`px-2 py-0.5 inline-flex items-center gap-1 text-[10px] font-black rounded-full border ${
                            (complaint.confirmation_count || 0) >= 5
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : (complaint.confirmation_count || 0) > 0
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            👥 {complaint.confirmation_count || 0} Affected
                          </span>

                          {/* Merged Reports Badge */}
                          {(complaint.merged_reports_count || 0) > 0 && (
                            <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                              📑 +{complaint.merged_reports_count} Merged
                            </span>
                          )}

                          {complaint.is_community_critical && (
                            <span className="px-2 py-0.5 inline-flex text-[9px] font-black uppercase tracking-wider rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              🔥 Critical
                            </span>
                          )}
                        </div>

                        {/* Reporter Civic Reputation Badge */}
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <span>Reporter:</span>
                          <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.2 rounded-md font-bold">
                            ★ {complaint.reporter_reputation || 0} pts
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-[11px] font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                      {formatDate(complaint.created_at)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      {updatingId === complaint.id ? (
                        <span className="text-slate-400 text-xs flex items-center justify-end gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Updating
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {complaint.status !== 'assigned' && complaint.status !== 'in_progress' && complaint.status !== 'resolved' && complaint.status !== 'verified' && (
                            <button
                              onClick={(e) => handleQuickStatus(e, complaint.id, 'assigned')}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                          {complaint.status !== 'in_progress' && complaint.status !== 'resolved' && complaint.status !== 'verified' && (
                            <button
                              onClick={(e) => handleQuickStatus(e, complaint.id, 'in_progress')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Start Work
                            </button>
                          )}
                          {complaint.status !== 'resolved' && complaint.status !== 'verified' && (
                            <button
                              onClick={(e) => handleQuickStatus(e, complaint.id, 'resolved')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                          {complaint.status === 'resolved' && (
                            <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Awaiting Citizen Verify
                            </span>
                          )}
                          {complaint.status === 'verified' && (
                            <span className="text-teal-700 font-bold text-[11px] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

