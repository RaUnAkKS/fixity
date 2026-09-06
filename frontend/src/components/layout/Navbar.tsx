'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, Shield, User, PlusCircle, FileSpreadsheet, LayoutDashboard, Award, CheckCircle2, ChevronRight, Info, Languages, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { ReputationBreakdown } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

export function Navbar() {
  const { user, isAuthenticated, isOfficer, logout, switchRole } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reputationModalOpen, setReputationModalOpen] = useState(false);
  const [reputationData, setReputationData] = useState<ReputationBreakdown | null>(null);
  const [loadingReputation, setLoadingReputation] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  async function openReputationModal() {
    setReputationModalOpen(true);
    if (!reputationData) {
      try {
        setLoadingReputation(true);
        const data = await api.get<ReputationBreakdown>('/api/auth/reputation');
        setReputationData(data);
      } catch (e) {
        console.error('Failed to load reputation details', e);
      } finally {
        setLoadingReputation(false);
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-700 to-blue-600 text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              F
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                FIXITY
              </span>
              <span className="text-[10px] font-semibold text-blue-700 tracking-wider uppercase">
                Civic Resolution
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive('/') && pathname === '/'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {t('home')}
            </Link>
            
            {isAuthenticated ? (
              <>
                {isOfficer ? (
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive('/dashboard')
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-blue-700" />
                    {t('dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/report"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive('/report')
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      {t('report_issue')}
                    </Link>
                    <Link
                      href="/complaints?view=nearby"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive('/complaints') && typeof window !== 'undefined' && window.location.search.includes('view=nearby')
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      {t('tab_nearby_issues')}
                    </Link>
                    <Link
                      href="/complaints"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive('/complaints') && (typeof window === 'undefined' || !window.location.search.includes('view=nearby'))
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      {t('my_complaints')}
                    </Link>
                    <Link
                      href="/profile"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive('/profile')
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                      <span>{language === 'hi' ? 'नागरिक प्रोफ़ाइल' : 'Reputation Profile'}</span>
                    </Link>
                  </>
                )}
              </>
            ) : null}
          </div>

          {/* Desktop Right Auth & Language Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={language === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
            >
              <Languages className="h-3.5 w-3.5 text-blue-700" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Civic Reputation Badge for Citizens */}
                {!isOfficer && (
                  <button
                    onClick={openReputationModal}
                    title="View your Civic Reputation & Contribution Breakdown"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/80 rounded-full text-xs font-bold text-amber-900 transition-colors cursor-pointer"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                    <span>{user?.civic_level || 'Active Citizen'}</span>
                    <span className="bg-amber-200/70 text-amber-950 px-1.5 py-0.2 rounded-full text-[11px] font-black">
                      {user?.civic_reputation ?? 0}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full pl-3 pr-1.5 py-1">
                  <div className="flex items-center gap-1.5">
                    {isOfficer ? (
                      <Shield className="h-3.5 w-3.5 text-blue-700" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span className="text-xs font-semibold text-slate-800 max-w-[130px] truncate">
                      {user?.full_name || 'User'}
                    </span>
                    <button
                      onClick={async () => {
                        const targetRole = isOfficer ? 'citizen' : 'officer';
                        await switchRole(targetRole);
                        if (targetRole === 'officer') {
                          window.location.href = '/dashboard';
                        } else {
                          window.location.href = '/complaints';
                        }
                      }}
                      title={`Role: ${user?.role}. Click to switch to ${isOfficer ? 'Citizen' : 'Officer'} mode.`}
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all cursor-pointer shadow-2xs hover:scale-105 ${
                        isOfficer
                          ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                          : 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
                      }`}
                    >
                      {user?.role || 'Citizen'} ⇄
                    </button>
                  </div>
                  <button
                    onClick={logout}
                    title="Log out of Fixity"
                    className="inline-flex items-center justify-center h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-white rounded-full transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('sign_in')}
                </Link>
                <Link
                  href="/report"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-all shadow-sm shadow-blue-700/20"
                >
                  {t('report_issue')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 shadow-lg">
          {/* Mobile Language Switcher */}
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Language / भाषा:</span>
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 rounded-lg text-xs font-bold border border-slate-200"
            >
              <Languages className="h-3.5 w-3.5 text-blue-700" />
              <span>{language === 'en' ? 'हिन्दी में देखें' : 'Switch to English'}</span>
            </button>
          </div>

          <Link 
            href="/" 
            onClick={() => setMobileOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/') && pathname === '/' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('home')}
          </Link>
          
          {isAuthenticated ? (
            <>
              {isOfficer ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                    isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t('dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    href="/report"
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                      isActive('/report') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('report_issue')}
                  </Link>
                  <Link
                    href="/complaints?view=nearby"
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                      isActive('/complaints') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('tab_nearby_issues')}
                  </Link>
                  <Link
                    href="/complaints"
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                      isActive('/complaints') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('my_complaints')}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                      isActive('/profile') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'hi' ? 'नागरिक प्रोफ़ाइल' : 'Reputation Profile'}
                  </Link>
                </>
              )}
              {!isOfficer && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-semibold">Civic Reputation:</span>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openReputationModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                    <span>{user?.civic_level || 'Active Citizen'}</span>
                    <span className="bg-amber-200/70 text-amber-950 px-1.5 rounded-full text-[11px] font-black">
                      {user?.civic_reputation ?? 0}
                    </span>
                  </button>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {user?.full_name} ({user?.role})
                </span>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> {t('logout')}
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {t('sign_in')}
              </Link>
              <Link
                href="/report"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                {t('report_issue')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Civic Reputation Breakdown Modal */}
      {reputationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                  <Award className="h-3.5 w-3.5 text-amber-600" />
                  {reputationData?.civic_level || user?.civic_level || 'Active Citizen'}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Civic Contribution &amp; Reputation
                </h3>
              </div>
              <button
                onClick={() => setReputationModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Score Showcase */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Score</span>
                <div className="text-3xl font-black tracking-tight">
                  {reputationData?.civic_reputation ?? user?.civic_reputation ?? 0}
                  <span className="text-sm font-normal text-slate-400 ml-1.5">points</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Calculated deterministically from genuine community actions.
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <Award className="h-8 w-8 text-amber-400" />
              </div>
            </div>

            {/* Points Breakdown List */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Points Breakdown
              </span>

              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800">Valid Reports Submitted</span>
                    <p className="text-[11px] text-slate-500">
                      {reputationData?.reports_count ?? user?.reports_count ?? 0} reports (+5 pts each)
                    </p>
                  </div>
                  <span className="font-bold text-blue-700">
                    +{reputationData?.breakdown?.valid_reports_points ?? ((user?.reports_count || 0) * 5)} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800">Community Confirmations Given</span>
                    <p className="text-[11px] text-slate-500">
                      {reputationData?.community_confirmations_count ?? user?.community_confirmations_count ?? 0} neighborhood issues confirmed (+2 pts each)
                    </p>
                  </div>
                  <span className="font-bold text-blue-700">
                    +{reputationData?.breakdown?.confirmations_given_points ?? ((user?.community_confirmations_count || 0) * 2)} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800">Verified Resolutions</span>
                    <p className="text-[11px] text-slate-500">
                      {reputationData?.verified_resolutions_count ?? user?.verified_resolutions_count ?? 0} repaired issues verified (+5 pts each)
                    </p>
                  </div>
                  <span className="font-bold text-blue-700">
                    +{reputationData?.breakdown?.verified_resolutions_points ?? ((user?.verified_resolutions_count || 0) * 5)} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800">Community Confirmation Bonuses</span>
                    <p className="text-[11px] text-slate-500">
                      Earned when neighbors confirm your reported issues (+2 pts/confirmation, max +10/report)
                    </p>
                  </div>
                  <span className="font-bold text-blue-700">
                    +{reputationData?.breakdown?.community_bonuses_points ?? 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Statement */}
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Fixity prioritizes quality and community validation over quantity. Confirmation caps and single-vote rules prevent spam and highlight genuine municipal priorities.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                href="/profile"
                onClick={() => setReputationModalOpen(false)}
                className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-sm"
              >
                View Full Civic Profile &rarr;
              </Link>
              <button
                onClick={() => setReputationModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

