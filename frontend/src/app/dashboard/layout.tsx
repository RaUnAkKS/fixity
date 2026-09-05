'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Map,
  BarChart3,
  Layers,
  Bot,
  FolderKanban,
  TrendingUp,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';

const sidebarLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/complaints', label: 'Complaints Registry', icon: FileText },
  { href: '/dashboard/heatmap', label: 'Issue Heatmap', icon: Map },
  { href: '/dashboard/priorities', label: 'Ward Priorities', icon: BarChart3 },
  { href: '/dashboard/clusters', label: 'Issue Clusters', icon: Layers },
  { href: '/dashboard/copilot', label: 'Intelligence Copilot', icon: Bot },
  { href: '/dashboard/projects', label: 'Municipal Projects', icon: FolderKanban },
  { href: '/dashboard/impact', label: 'Resolution Metrics', icon: TrendingUp },
  { href: '/dashboard/simulator', label: 'What-If Simulator', icon: Calculator },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-900 text-white">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-300">
              <Building2 className="h-4 w-4" />
              Municipal Operations
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex items-center justify-center h-6 w-6 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-slate-200 bg-white">
        <nav className="flex items-center justify-around px-2 py-1.5">
          {sidebarLinks.slice(0, 5).map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-600 hover:text-slate-900'
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
        <div className="p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}
