'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { ReputationBreakdown } from '@/lib/types';
import {
  Award,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, isOfficer } = useAuth();
  const { language, t } = useLanguage();
  const [repData, setRepData] = useState<ReputationBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReputation() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<ReputationBreakdown>('/api/auth/reputation');
        setRepData(data);
      } catch (err: any) {
        console.error('Failed to fetch reputation data', err);
        setError(err.message || 'Unable to retrieve civic reputation data.');
      } finally {
        setLoading(false);
      }
    }
    loadReputation();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Civic Profile Access</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please sign in to your municipal account to review your civic reputation, verified community contributions, and activity track record.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = repData?.civic_reputation ?? user?.civic_reputation ?? 0;
  const level = repData?.civic_level ?? user?.civic_level ?? 'Active Citizen';
  const reports = repData?.reports_count ?? user?.reports_count ?? 0;
  const confirmations = repData?.community_confirmations_count ?? user?.community_confirmations_count ?? 0;
  const verified = repData?.verified_resolutions_count ?? user?.verified_resolutions_count ?? 0;

  const validReportPts = repData?.breakdown?.valid_reports_points ?? (reports * 5);
  const confirmPts = repData?.breakdown?.confirmations_given_points ?? (confirmations * 2);
  const verifyPts = repData?.breakdown?.verified_resolutions_points ?? (verified * 5);
  const bonusPts = repData?.breakdown?.community_bonuses_points ?? 0;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Page Title & User Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
              <Shield className="h-3.5 w-3.5" />
              Official Citizen Record
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {user?.full_name || 'Citizen Profile'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Registered Account: {user?.email} • Role: <span className="capitalize font-semibold text-slate-700">{user?.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/complaints"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              My Grievances
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-700/20"
            >
              <PlusCircle className="h-4 w-4" />
              Report Issue
            </Link>
          </div>
        </div>

        {/* HERO CARD: Civic Reputation Score & Level */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 space-y-6 relative overflow-hidden">
          {/* Subtle civic watermark pattern in background */}
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-5 pointer-events-none">
            <Award className="h-96 w-96 text-white" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Civic Reputation Score
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                  {score}
                </span>
                <span className="text-sm font-semibold text-slate-300">points</span>
              </div>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                A deterministic, transparent metric of genuine contributions to neighborhood improvement. Derived solely from verified civic actions.
              </p>
            </div>

            <div className="flex flex-col sm:items-end justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
                <Award className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-black">{level}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Tier based on cumulative community integrity
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar inside Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 relative z-10">
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
              <span className="text-[11px] text-slate-400 block font-medium">Valid Reports</span>
              <span className="text-xl font-black text-white">{reports}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">+{validReportPts} pts</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
              <span className="text-[11px] text-slate-400 block font-medium">Confirmations Given</span>
              <span className="text-xl font-black text-white">{confirmations}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">+{confirmPts} pts</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
              <span className="text-[11px] text-slate-400 block font-medium">Verified Repairs</span>
              <span className="text-xl font-black text-white">{verified}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">+{verifyPts} pts</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
              <span className="text-[11px] text-slate-400 block font-medium">Neighbor Endorsements</span>
              <span className="text-xl font-black text-white">
                {repData?.confirmed_reports_count ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">+{bonusPts} pts</span>
            </div>
          </div>
        </div>

        {/* Detailed Deterministic Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Points Breakdown Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                How Your Reputation Is Computed
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every point is calculated deterministically by municipal backend verification.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Report Points */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    Valid Civic Complaints
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Submitted grievances that are unique, accurately categorized, and geolocated (+5 pts per valid complaint). Duplicate submissions do not award duplicate points.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-blue-700">+{validReportPts}</span>
                  <span className="text-[10px] text-slate-400 block">{reports} reports</span>
                </div>
              </div>

              {/* Confirmation Points */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Neighborhood Confirmations Given
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Supporting neighboring issues (&quot;I&apos;m affected too&quot;) helps officers triage genuine multi-resident hotspots (+2 pts per confirmed issue).
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-indigo-700">+{confirmPts}</span>
                  <span className="text-[10px] text-slate-400 block">{confirmations} confirmed</span>
                </div>
              </div>

              {/* Verified Resolution Points */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Verified Municipal Resolutions
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Auditing completed repairs and providing ground feedback officially verifies ticket closure (+5 pts per verified fix).
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-emerald-700">+{verifyPts}</span>
                  <span className="text-[10px] text-slate-400 block">{verified} verified</span>
                </div>
              </div>

              {/* Community Confirmation Bonuses */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Community Validation Bonuses
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Awarded when neighbors verify and support issues you reported (+2 pts per confirmation, capped at max +10 pts per issue to prevent gaming).
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-amber-700">+{bonusPts}</span>
                  <span className="text-[10px] text-slate-400 block">bonuses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Integrity & Principles Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Civic Governance Rules</h4>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 block">1. Anti-Gaming Architecture</span>
                  <p className="text-[11px] text-slate-500">
                    Duplicate submissions at the same location are merged into existing parent tickets and award 0 points. Single-vote limits strictly prevent artificial inflation.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 block">2. Fair Triage Guarantee</span>
                  <p className="text-[11px] text-slate-500">
                    Officer dispatch is prioritized by visual severity and neighborhood confirmation count, ensuring equal service access for all citizens regardless of score.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 block">3. Verification Trust</span>
                  <p className="text-[11px] text-slate-500">
                    Trusted citizens help ward officers resolve disputes faster and participate in neighborhood verification audits.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Explore Nearby Issues</h4>
              <p className="text-xs text-slate-500">
                View ongoing civic repairs in your area and confirm issues that affect you.
              </p>
              <Link
                href="/complaints?view=nearby"
                className="inline-flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-bold text-slate-800 hover:text-blue-700 border border-slate-200/60 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  View Nearby Issues
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
