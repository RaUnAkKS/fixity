'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getStatusColor, getStatusLabel, getSeverityLabel, getSeverityColor, getCategoryLabel, formatDate, formatDateTime } from '@/lib/utils';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  Check,
  ExternalLink,
  Loader2,
  Star,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmationResponse } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

const ComplaintMapCard = dynamic(
  () => import('@/components/map/ComplaintMapCard'),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-2xl bg-slate-100 border border-slate-200/80 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-xs">Loading incident map and ward coordinates...</span>
      </div>
    ),
  }
);

export default function ComplaintDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, isOfficer } = useAuth();
  const { language, t } = useLanguage();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleConfirm() {
    if (!user) {
      setConfirmMsg({ type: 'error', text: 'Please sign in to confirm this civic issue.' });
      return;
    }
    try {
      setConfirming(true);
      setConfirmMsg(null);
      const res = await api.post<ConfirmationResponse>(`/api/complaints/${id}/confirm`);
      setComplaint((prev: any) => ({
        ...prev,
        confirmation_count: res.confirmation_count,
        community_signal: res.community_signal,
        community_signal_score: res.community_signal_score,
        is_community_critical: res.is_community_critical,
        user_has_confirmed: true,
      }));
      setConfirmMsg({
        type: 'success',
        text: 'Thank you. Your confirmation increases priority for municipal officers (+2 Civic Reputation).',
      });
    } catch (err: any) {
      setConfirmMsg({
        type: 'error',
        text: err.message || 'Failed to confirm issue. You may have already confirmed it.',
      });
    } finally {
      setConfirming(false);
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    try {
      setUpdating(true);
      setStatusMsg(null);
      const updated = await api.patch<any>(`/api/complaints/${id}/status`, { status: newStatus });
      setComplaint((prev: any) => ({ ...prev, status: updated.status || newStatus }));
      setStatusMsg({
        type: 'success',
        text: `Case successfully marked as ${getStatusLabel(newStatus)}`,
      });
    } catch (err: any) {
      const isRoleError = err.message && err.message.toLowerCase().includes('requires one of roles');
      setStatusMsg({
        type: 'error',
        text: isRoleError
          ? 'Officer Privileges Required: Please ensure you are logged in with an Officer or Admin account.'
          : (err.message || 'Failed to update status'),
      });
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await api.get<any>(`/api/complaints/${id}`);
        setComplaint(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load complaint details');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
        <span className="text-xs text-slate-500">Retrieving official case record...</span>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Link href="/complaints" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> Back to Complaints
        </Link>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3 shadow-xs">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Case Record Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested complaint does not exist or has been archived.'}</p>
        </div>
      </div>
    );
  }

  const { original_text, translated_text, category, subcategory, severity, status, address, created_at, ai_analysis, evidence } = complaint;

  // Lifecycle steps for timeline
  const steps = [
    { key: 'submitted', label: language === 'hi' ? 'दर्ज (Submitted)' : 'Submitted' },
    { key: 'analyzed', label: language === 'hi' ? 'प्राथमिकता (Triage)' : 'Triage & Priority' },
    { key: 'assigned', label: language === 'hi' ? 'आवंटित (Assigned)' : 'Department Assigned' },
    { key: 'in_progress', label: language === 'hi' ? 'प्रगति पर (In Progress)' : 'Work In Progress' },
    { key: 'resolved', label: language === 'hi' ? 'समाधान (Resolved)' : 'Resolved' },
    { key: 'verified', label: language === 'hi' ? 'सत्यापित (Verified)' : 'Citizen Verified' },
  ];

  const statusOrder = ['submitted', 'analyzing', 'analyzed', 'assigned', 'in_progress', 'resolved', 'verified'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Top Navigation & Case Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {language === 'hi' ? 'वापस मेरी शिकायतें (Back)' : 'Back to My Complaints'}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">ID: {id}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
              {getStatusLabel(status, language)}
            </span>
          </div>
        </div>

        {/* Status Stepper Progression Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {steps.map((step, idx) => {
              const isPast = statusOrder.indexOf(step.key) <= currentIndex && currentIndex !== -1;
              const isCurrent = step.key === status || (step.key === 'analyzed' && status === 'analyzing');

              return (
                <div key={step.key} className="flex flex-col items-center relative flex-1 text-center">
                  {idx !== 0 && (
                    <div
                      className={`absolute top-3.5 right-[50%] left-[-50%] h-0.5 -z-0 transition-colors ${
                        isPast ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                      isPast
                        ? 'bg-blue-700 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 ${isCurrent ? 'text-blue-700' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Case File Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Issue Header & Description */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Grievance Description
            </span>
            <p className="text-base text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
              {original_text}
            </p>

            {/* Intelligent Duplicate Merging Notice */}
            {complaint.parent_issue_id && (
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800 uppercase tracking-wider text-[11px]">
                    <Users className="h-3.5 w-3.5 text-amber-600" /> Linked to Active Civic Issue
                  </span>
                  <Link
                    href={`/complaints/${complaint.parent_issue_id}`}
                    className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    View Primary Issue #{complaint.parent_issue_id.substring(0, 8)} &rarr;
                  </Link>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  This report has been intelligently merged with an ongoing neighborhood ticket at this location. Your report boosts neighborhood priority without fragmenting municipal crew dispatch.
                </p>
              </div>
            )}

            {complaint.merged_reports_count > 0 && (
              <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span className="font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-700" />
                  {complaint.merged_reports_count} Additional Citizen {complaint.merged_reports_count === 1 ? 'Report' : 'Reports'} Linked
                </span>
                <span className="text-[11px] text-blue-700 font-medium">
                  Neighborhood Duplicate Merging Active
                </span>
              </div>
            )}

            {translated_text && translated_text !== original_text && (
              <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-bold uppercase text-blue-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Standard English Translation
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{translated_text}</p>
              </div>
            )}
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> Location
              </span>
              <p className="text-xs font-bold text-slate-800 truncate" title={address || 'Recorded Coordinates'}>
                {address || 'Recorded Coordinates'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date Reported
              </span>
              <p className="text-xs font-bold text-slate-800">{formatDate(created_at)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-slate-400" /> {language === 'hi' ? 'श्रेणी' : 'Category'}
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {category ? getCategoryLabel(category, language) : (language === 'hi' ? 'वर्गीकरण प्रतीक्षारत' : 'Auto-Triage Pending')}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400" /> {language === 'hi' ? 'गंभीरता' : 'Severity Index'}
              </span>
              <p className="text-xs font-bold text-slate-800">
                {severity ? `${severity}/100 (${getSeverityLabel(severity, language)})` : (language === 'hi' ? 'स्कोर प्रतीक्षारत' : 'Pending Score')}
              </p>
            </div>
          </div>

          {/* Community Impact & Citizen Confirmation Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-700" />
                  Community Impact &amp; Confirmation Signal
                </span>
                <p className="text-xs text-slate-500">
                  Real neighborhood verification prevents duplicate tickets and informs municipal dispatch priority.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    complaint.community_signal === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : complaint.community_signal === 'Elevated'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : complaint.community_signal === 'Moderate'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Signal: {complaint.community_signal || 'Low'} ({complaint.community_signal_score || 1}/10)
                </span>
              </div>
            </div>

            {complaint.is_community_critical && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Community-Critical Priority:</strong> High severity combined with multiple citizen confirmations places this at urgent municipal dispatch.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {complaint.confirmation_count || 0}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {complaint.confirmation_count === 1
                      ? '1 citizen has confirmed this issue'
                      : `${complaint.confirmation_count || 0} citizens have confirmed this issue`}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {complaint.confirmation_count > 0 ? 'Verified locality impact' : 'Be the first neighbor to confirm'}
                  </p>
                </div>
              </div>

              <div>
                {isOfficer ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                    {language === 'hi' ? 'अधिकारी समीक्षा दृश्य' : 'Officer Triage View'}
                  </span>
                ) : complaint.user_has_confirmed ? (
                  <div className="flex items-center gap-2">
                    {(complaint.is_author || (user && user.id === complaint.citizen_id)) && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {language === 'hi' ? 'आपकी रिपोर्ट' : 'Your Report'}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {language === 'hi' ? '✓ आपने समर्थन दिया है' : 'You confirmed this issue'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {(complaint.is_author || (user && user.id === complaint.citizen_id)) && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {language === 'hi' ? 'आपकी रिपोर्ट' : 'Your Report'}
                      </span>
                    )}
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {confirming ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )}
                      {language === 'hi' ? 'मैं भी प्रभावित हूँ (+2 अंक)' : "I'm affected too (+2 Rep)"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {confirmMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  confirmMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {confirmMsg.text}
              </div>
            )}
          </div>

          {/* Geospatial Site Map Section matching media_1788672295154.png */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                Incident Site &amp; Ward Geospatial Map
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {(complaint.latitude ?? 28.6475).toFixed(4)}, {(complaint.longitude ?? 77.3150).toFixed(4)}
              </span>
            </div>
            <ComplaintMapCard
              complaintId={id}
              latitude={complaint.latitude ?? 28.6475}
              longitude={complaint.longitude ?? 77.3150}
              address={complaint.address || 'Near Metro Pillar 148, Outer Ring Road Link, Anand Vihar'}
              category={category}
              severity={severity}
            />
          </div>

          {/* AI Analysis Diagnosis Card */}
          {ai_analysis && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  AI Case Triage &amp; Assessment
                </h3>
                {(ai_analysis.suggested_department || ai_analysis.department) && (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Dept: {ai_analysis.suggested_department || ai_analysis.department}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Summary:</strong> {ai_analysis.summary || complaint.ai_description || 'Analysis completed.'}
              </p>

              {ai_analysis.issues && ai_analysis.issues.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Key Diagnostic Points:</span>
                  <ul className="grid sm:grid-cols-2 gap-1.5">
                    {ai_analysis.issues.map((issue: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="truncate">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Photo Evidence Gallery */}
          {evidence && evidence.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                Attached Evidence Photos
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {evidence.map((ev: any) => (
                  <div key={ev.id} className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200/80 shadow-xs relative group">
                    {ev.file_url ? (
                      <img
                        src={`${API_BASE_URL}${ev.file_url}`}
                        alt="Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No media preview</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow & Status Actions Section */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {isOfficer ? 'Officer Resolution Actions' : 'Resolution Progress & Tracking'}
              </h3>
              {statusMsg && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  {statusMsg.text}
                </span>
              )}
            </div>

            {/* If Officer / Admin: show department transition actions */}
            {isOfficer && (
              <div className="flex flex-wrap items-center gap-3">
                {status !== 'assigned' && status !== 'in_progress' && status !== 'resolved' && status !== 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate('assigned')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {updating ? 'Updating...' : 'Assign to Department'}
                  </button>
                )}

                {status !== 'in_progress' && status !== 'resolved' && status !== 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {updating ? 'Updating...' : 'Start Maintenance Work'}
                  </button>
                )}

                {status !== 'resolved' && status !== 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate('resolved')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {updating ? 'Updating...' : 'Mark as Resolved'}
                  </button>
                )}

                {status === 'resolved' && (
                  <div className="w-full bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between">
                    <span>Issue marked resolved by department. Awaiting citizen verification audit.</span>
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={updating}
                      className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Reopen Work
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Citizen View: Status explanation banner for active states */}
            {!isOfficer && (
              <div>
                {status === 'submitted' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Your grievance has been submitted into the municipal queue. AI triage and department routing are underway.</span>
                  </div>
                )}
                {(status === 'analyzing' || status === 'analyzed') && (
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Issue has been classified and prioritized by AI triage. Awaiting ward department dispatch.</span>
                  </div>
                )}
                {status === 'assigned' && (
                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 text-xs text-purple-800 flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>Assigned to <strong>{ai_analysis?.suggested_department || category || 'Municipal Department'}</strong> for field maintenance dispatch.</span>
                  </div>
                )}
                {status === 'in_progress' && (
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 animate-spin" />
                    <span>Municipal field maintenance crew is actively working on resolving this issue on site.</span>
                  </div>
                )}
              </div>
            )}

            {/* Citizen Verification Prompt (when resolved) */}
            {status === 'resolved' && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    {language === 'hi' ? 'विभाग द्वारा समस्या का समाधान किया गया है!' : 'Department has marked this issue as resolved!'}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {language === 'hi' ? 'कृपया पुष्टि करें कि क्या कार्य संतोषजनक रूप से पूरा हुआ है।' : 'Please confirm if the repair meets your satisfaction to officially close the ticket.'}
                  </p>
                </div>
                {!isOfficer && (
                  <Link 
                    href={`/complaints/${id}/verify`}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-700/20 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {language === 'hi' ? 'समाधान सत्यापित करें और रेटिंग दें →' : 'Verify & Rate Resolution →'}
                  </Link>
                )}
              </div>
            )}

            {/* Verified Confirmation Banner */}
            {status === 'verified' && (
              <div className="w-full bg-teal-50/70 p-5 rounded-2xl border border-teal-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-700" />
                    {language === 'hi' ? 'नागरिक द्वारा समाधान सत्यापित एवं बंद' : 'Resolution Confirmed & Closed by Citizen'}
                  </span>
                  {ai_analysis?.verification?.rating && (
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-teal-200">
                      <span className="text-xs font-bold text-slate-800">{ai_analysis.verification.rating} / 5</span>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  )}
                </div>
                {ai_analysis?.verification?.comment && (
                  <p className="text-xs text-teal-800 italic">
                    &quot;{ai_analysis.verification.comment}&quot;
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

