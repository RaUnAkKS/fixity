'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  Map,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/copilot', label: 'AI Copilot', icon: Sparkles, badge: 'Live' },
  { href: '/dashboard/complaints', label: 'Complaints', icon: FileText },
  { href: '/dashboard/heatmap', label: 'Map Heatmap', icon: Map },
  { href: '/dashboard/clusters', label: 'Issue Clusters', icon: Layers },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, isOfficer } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
        <span className="text-xs text-slate-500">Verifying officer credentials...</span>
      </div>
    );
  }

  // Guard: if user is not logged in or is a citizen, restrict access
  if (!user || !isOfficer) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Officer Console Restricted
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This operations area is reserved for municipal officers and administrators. As a citizen, you can track and verify your registered issues under My Complaints.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link
              href="/complaints"
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-700/20"
            >
              Go to My Complaints
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Sign In as Officer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200/80 bg-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-slate-900 text-white">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-blue-300">
              <Shield className="h-4 w-4 text-blue-400" />
              Officer Console
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2.5 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs shadow-blue-700/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200/60'}`}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <nav className="flex items-center justify-around px-2 py-2">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 pb-16 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}

