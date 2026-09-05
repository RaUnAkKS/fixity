'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import {
  Menu,
  X,
  LogOut,
  User,
  Building2,
  Phone,
  HelpCircle,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isOfficer, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 shadow-sm bg-white">
      {/* Top Utility Bar (Government/Municipal Portal Style) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
              MUNICIPAL CIVIC SERVICES PORTAL
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">Public Grievance Redressal & Resolution System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300 text-xs">
            <span className="hidden sm:inline flex items-center gap-1">
              <Phone className="h-3 w-3 text-blue-400" /> Toll-Free Helpline: 1800-11-2026
            </span>
            <Link href="/about" className="hover:text-white transition-colors">Help & FAQ</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo / Wordmark */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white font-bold text-lg shadow-sm">
                F
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  FIXITY
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
                  Civic Resolution Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                Home
              </Link>
              <Link href="/report" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                Report Issue
              </Link>
              
              {isAuthenticated ? (
                <>
                  {isOfficer ? (
                    <>
                      <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                        Municipal Dashboard
                      </Link>
                      <Link href="/dashboard/complaints" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                        Complaints Registry
                      </Link>
                      <Link href="/dashboard/heatmap" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                        City Heatmap
                      </Link>
                      <Link href="/dashboard/copilot" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                        Intelligence Copilot
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/complaints" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                        My Complaints
                      </Link>
                      <Link href="/dashboard/heatmap" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                        Public Map
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href="/complaints" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                    Public Complaints
                  </Link>
                  <Link href="/dashboard/heatmap" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors">
                    Public Map
                  </Link>
                </>
              )}
            </div>

            {/* Desktop Right Auth Section */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50">
                    <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-blue-700 text-white text-xs font-semibold">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-medium text-slate-800">
                      {user?.full_name}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Citizen/Officer Sign In
                  </Link>
                  <Link
                    href="/report"
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors shadow-sm"
                  >
                    Report New Issue
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link 
                href="/" 
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Home
              </Link>
              <Link 
                href="/report" 
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Report Issue
              </Link>
              
              {isAuthenticated ? (
                <>
                  {isOfficer ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Municipal Dashboard</Link>
                      <Link href="/dashboard/complaints" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Complaints Registry</Link>
                      <Link href="/dashboard/heatmap" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">City Heatmap</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/complaints" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">My Complaints</Link>
                    </>
                  )}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout ({user?.full_name})
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign In</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Register Account</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
