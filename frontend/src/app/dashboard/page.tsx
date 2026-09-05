'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DashboardSummary, PriorityScore } from '@/lib/types';
import {
  AlertTriangle,
  FileText,
  MapPin,
  CheckCircle2,
  FolderKanban,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Loader2,
  Building2,
  Bot,
  Calculator
} from 'lucide-react';

const mockSummary: DashboardSummary = {
  total_complaints: 1247,
  active_complaints: 342,
  high_priority_areas: 8,
  pending_verifications: 56,
  active_projects: 12,
  resolved_this_month: 89,
  avg_resolution_score: 72.5,
};

const mockPriorities: PriorityScore[] = [
  {
    id: '1',
    ward_id: 7,
    ward_name: 'Connaught Place Ward',
    category: 'Road Infrastructure',
    total_score: 87,
    demand_score: 92,
    severity_score: 85,
    population_score: 78,
    infrastructure_gap_score: 90,
    unresolved_score: 76,
  },
  {
    id: '2',
    ward_id: 12,
    ward_name: 'Karol Bagh Ward',
    category: 'Water Supply',
    total_score: 81,
    demand_score: 88,
    severity_score: 79,
    population_score: 85,
    infrastructure_gap_score: 72,
    unresolved_score: 82,
  },
  {
    id: '3',
    ward_id: 3,
    ward_name: 'Chandni Chowk Ward',
    category: 'Drainage & Sewage',
    total_score: 76,
    demand_score: 71,
    severity_score: 82,
    population_score: 90,
    infrastructure_gap_score: 68,
    unresolved_score: 65,
  },
  {
    id: '4',
    ward_id: 18,
    ward_name: 'Dwarka Ward',
    category: 'Sanitation & Waste',
    total_score: 69,
    demand_score: 65,
    severity_score: 73,
    population_score: 60,
    infrastructure_gap_score: 78,
    unresolved_score: 71,
  },
  {
    id: '5',
    ward_id: 25,
    ward_name: 'Rohini Ward',
    category: 'Electricity',
    total_score: 63,
    demand_score: 58,
    severity_score: 68,
    population_score: 72,
    infrastructure_gap_score: 55,
    unresolved_score: 60,
  },
];

export default function DashboardPage() {
  const [summary] = useState<DashboardSummary>(mockSummary);
  const [priorities] = useState<PriorityScore[]>(mockPriorities);

  const statCards = [
    {
      label: 'Open Complaints',
      value: summary.active_complaints,
      icon: FileText,
      href: '/dashboard/complaints',
    },
    {
      label: 'High Priority Wards',
      value: summary.high_priority_areas,
      icon: AlertTriangle,
      href: '/dashboard/priorities',
    },
    {
      label: 'Pending Verifications',
      value: summary.pending_verifications,
      icon: CheckCircle2,
      href: '/dashboard/complaints',
    },
    {
      label: 'Active Municipal Projects',
      value: summary.active_projects,
      icon: FolderKanban,
      href: '/dashboard/projects',
    },
    {
      label: 'Resolved This Month',
      value: summary.resolved_this_month,
      icon: TrendingUp,
      href: '/dashboard/impact',
    },
    {
      label: 'Total Registered File Count',
      value: summary.total_complaints.toLocaleString(),
      icon: BarChart3,
      href: '/dashboard/complaints',
    },
  ];

  return (
    <div className="space-y-6 bg-slate-50">
      
      {/* Header */}
      <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <Building2 className="h-4 w-4" /> Operations Command Center
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Municipal Issue Dashboard
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Live operational status of grievances, priority scores, and department dispatching across municipal wards.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-600 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <card.icon className="h-4 w-4 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{card.value}</div>
            <div className="text-[11px] font-semibold text-slate-600 mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Resolution score bar */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Citywide Resolution Performance Score
            </h2>
            <span className="text-[11px] text-slate-500">Aggregated from verified citizen feedback & SLA compliance</span>
          </div>
          <Link
            href="/dashboard/impact"
            className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
          >
            View Detailed Metrics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {summary.avg_resolution_score}%
          </div>
          <div className="flex-1">
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-700 rounded-full"
                style={{ width: `${summary.avg_resolution_score}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 italic">
          Illustrative prototype metric
        </p>
      </div>

      {/* Top priority areas */}
      <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Highest Priority Municipal Wards
          </h2>
          <Link
            href="/dashboard/priorities"
            className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
          >
            View Complete Ward Priority Index <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {priorities.map((area, index) => (
            <div
              key={area.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-center h-6 w-6 rounded bg-slate-200 text-xs font-bold text-slate-800">
                #{index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 truncate">
                    {area.ward_name}
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                    {area.category}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${area.total_score >= 80 ? 'bg-red-600' : 'bg-amber-500'}`}
                      style={{ width: `${area.total_score}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    Score: {area.total_score}
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard/priorities"
                className="text-blue-700 font-semibold hover:underline shrink-0"
              >
                Inspect Ward →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick operational links */}
      <div className="grid md:grid-cols-3 gap-3">
        <Link
          href="/dashboard/heatmap"
          className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-600 transition-colors"
        >
          <MapPin className="h-4 w-4 text-blue-700 mb-2" />
          <h3 className="text-xs font-bold text-slate-900 mb-1">Issue Density Heatmap</h3>
          <p className="text-[11px] text-slate-600">Locate geospatial grievance clusters across the city</p>
        </Link>

        <Link
          href="/dashboard/copilot"
          className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-600 transition-colors"
        >
          <Bot className="h-4 w-4 text-blue-700 mb-2" />
          <h3 className="text-xs font-bold text-slate-900 mb-1">Intelligence Copilot</h3>
          <p className="text-[11px] text-slate-600">Query municipal database records via natural language</p>
        </Link>

        <Link
          href="/dashboard/simulator"
          className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-600 transition-colors"
        >
          <Calculator className="h-4 w-4 text-blue-700 mb-2" />
          <h3 className="text-xs font-bold text-slate-900 mb-1">What-If Budget Simulator</h3>
          <p className="text-[11px] text-slate-600">Model municipal expenditure scenarios and projected ROI</p>
        </Link>
      </div>

    </div>
  );
}
