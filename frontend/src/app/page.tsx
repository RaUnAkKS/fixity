'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  LayoutDashboard,
  Mic,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Shield,
  User,
  Award,
  Flame,
  Check,
} from 'lucide-react';
import { LiveCivicMapCard } from '@/components/home/LiveCivicMapCard';

export default function HomePage() {
  const { user, isAuthenticated, isOfficer } = useAuth();
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center text-center space-y-12">
        
        {/* Two-Column Hero with Live Civic Map Card */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center text-left">
          
          {/* Left Column: Vision & Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Civic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide shadow-xs animate-in fade-in duration-500">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {language === 'hi' 
                  ? 'नेक्स्ट-जेन सिविक इंटेलिजेंस प्लेटफॉर्म' 
                  : 'Next-Gen Civic Decision Intelligence Platform'}
              </span>
            </div>

            {/* Headline & Subtitle */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.1]">
                {language === 'hi' ? (
                  <>नागरिक आवाज़ से <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">सत्यापित परिणाम तक।</span></>
                ) : (
                  <>From Citizen Voice to <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Verified Impact.</span></>
                )}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {language === 'hi'
                  ? 'नागरिक समस्याओं को व्यवस्थित और सत्यापन योग्य प्रशासनिक कार्यवाही में बदलें। बहुभाषी आवाज़, फ़ोटो या टेक्स्ट द्वारा समस्या दर्ज करें और वास्तविक सुधार की पुष्टि करें।'
                  : 'Transforming unorganized civic distress into structured, auditable municipal action. Report localized infrastructure breakdowns via multilingual voice, text, or geotagged photos — and personally verify real results.'}
              </p>
            </div>

            {/* 3 Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isAuthenticated && isOfficer ? (
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-700/20 hover:shadow-lg hover:shadow-blue-700/30 transition-all group"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t('btn_officer_dashboard')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link 
                    href="/report" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-700/20 hover:shadow-lg hover:shadow-blue-700/30 transition-all group"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Report an Issue</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  
                  <Link 
                    href="/complaints" 
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-300 text-sm font-bold rounded-xl shadow-xs transition-all group"
                  >
                    <Flame className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span>Explore Nearby &amp; Upvote</span>
                  </Link>

                  <Link 
                    href="/complaints" 
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 shadow-xs transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                    <span>My Complaints</span>
                  </Link>
                </>
              )}
            </div>

            {/* 3 Feature Badges */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600 stroke-[2.5]" />
                <span>Deterministic 5-Factor Priority</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600 stroke-[2.5]" />
                <span>Hindi &amp; Regional Voice Dictation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600 stroke-[2.5]" />
                <span>Citizen Closed-Loop Sign-off</span>
              </div>
            </div>

          </div>

          {/* Right Column: Decorative Vector Live Civic Map Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <LiveCivicMapCard />
          </div>

        </div>

        {/* Hero Feature 1: Prominent Institutional Civic Reputation Card */}
        <div className="w-full max-w-4xl text-left">
          {isAuthenticated && !isOfficer ? (
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  Your Civic Reputation: {user?.civic_level || 'Active Citizen'}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {user?.civic_reputation ?? 0}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">verified points</span>
                </div>
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  Earned deterministically from valid reports (+5), community confirmations (+2), and verified repairs (+5).
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm group"
                >
                  <span>View Reputation Profile</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-[11px] text-slate-400">Deterministic anti-gaming ledger</span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <Award className="h-3.5 w-3.5 text-blue-600" />
                  Core Hero Feature
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Civic Reputation: Beyond Simple Complaint Filing
                </h3>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  Fixity encourages active neighborhood stewardship. Citizens earn verified civic standing for reporting valid issues, confirming community impact, and auditing municipal repairs.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
              >
                <span>Track Your Civic Score</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Twin Hero Accessibility Features */}
        {!isOfficer && (
          <div className="w-full max-w-4xl pt-2 text-left">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Accessibility Fast-Track Reporting
              </span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Zero typing required
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hero 1: Photo Auto-Scan */}
              <Link
                href="/report"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white border border-indigo-900/60 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    AI Auto-Scan
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-200 transition-colors">
                  Snap &amp; Auto-Fill Photo
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Take a photo of any pothole or civic issue. AI vision automatically identifies the problem, category, and GPS location.
                </p>
                <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 group-hover:translate-x-1 transition-transform">
                  <span>Snap Photo Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>

              {/* Hero 2: Voice Grievance */}
              <Link
                href="/report/voice"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white border border-blue-900/60 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                    <Mic className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Multilingual Voice
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-200 transition-colors">
                  Voice AI Grievance
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Speak naturally in Hindi, Tamil, Telugu, Marathi, Bengali, or English. AI automatically transcribes and triages your complaint.
                </p>
                <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 group-hover:translate-x-1 transition-transform">
                  <span>Record Voice Grievance</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Feature Cards: 4-Step Resolution Workflow */}
        <div className="w-full pt-4">
          <div className="text-left mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              How Fixity Works
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Mic className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                1. Report
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Photo, Voice or Text</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit via photo AI scan, voice recording, or text with auto-detected GPS.
              </p>
            </div>


            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                2. AI Triage
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Instant Categorization</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automated translation, severity scoring, and department assignment.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                3. Dispatch
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Officer Action</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Municipal ward officers receive alerts, schedule maintenance, and resolve.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                4. Verify
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Citizen Confirmation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Citizen rate the fix and close the ticket with photo confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Role-Specific Banner */}
        {isAuthenticated && isOfficer ? (
          <div className="w-full max-w-3xl bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Municipal Operations Console</h4>
                <p className="text-xs text-slate-500">Access your officer triage queue, map heatmaps, and resolution workflow metrics.</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-sm"
            >
              Open Console &rarr;
            </Link>
          </div>
        ) : !isAuthenticated ? (
          <div className="w-full max-w-3xl bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Municipal Officer Portal</h4>
                <p className="text-xs text-slate-500">Authorized ward officers and administrators can sign in to manage resolutions.</p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              Officer Sign In &rarr;
            </Link>
          </div>
        ) : null}

      </main>
    </div>
  );
}


