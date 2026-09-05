'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, BarChart3, Users, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ImpactDashboard() {
  // Mock Data
  const resolutionScores = [
    { project: 'Downtown Roads', score: 85 },
    { project: 'Park Lighting', score: 92 },
    { project: 'Water Pipes', score: 68 },
    { project: 'School Zoning', score: 78 },
    { project: 'Transit Shelters', score: 88 },
    { project: 'Waste Collection', score: 95 },
  ];

  const satisfactionTrend = [
    { date: 'Oct 1', rate: 72 },
    { date: 'Oct 8', rate: 75 },
    { date: 'Oct 15', rate: 78 },
    { date: 'Oct 22', rate: 76 },
    { date: 'Oct 29', rate: 82 },
    { date: 'Nov 5', rate: 85 },
  ];

  const verificationStatus = [
    { name: 'Verified Fixed', value: 65, color: '#16A34A' },
    { name: 'Partially Fixed', value: 25, color: '#D97706' },
    { name: 'Not Fixed / Mismatch', value: 10, color: '#DC2626' },
  ];

  const stats = [
    { label: 'Avg Resolution Score', value: '82/100', trend: '+5%', trendUp: true },
    { label: 'Total Citizen Verifications', value: '1,248', trend: '+12%', trendUp: true },
    { label: 'Citizen Satisfaction Rate', value: '85%', trend: '+2%', trendUp: true },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Municipal Impact & Verification Analytics</h1>
        <p className="text-sm text-slate-600 mt-1">Operational resolution assessment, citizen inspection feedback, and service metrics</p>
      </div>

      {/* Mandatory Hackathon Prototype Metric Notice */}
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-amber-800">Illustrative prototype metric</span>
          <p className="mt-0.5 text-amber-900">
            Resolution ratings and satisfaction indices are aggregated from post-intervention citizen verification reports submitted through Fixity.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-md border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${stat.trendUp ? 'text-emerald-700' : 'text-rose-700'}`}>
              <TrendingUp size={13} className={stat.trendUp ? '' : 'rotate-180'} />
              <span>{stat.trend} compared to previous month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Scores Chart */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Resolution Scores by Project</h2>
              <p className="text-xs text-slate-500">Post-resolution quality scoring (0-100)</p>
            </div>
            <span className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Prototype Metric
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="project" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '4px', border: '1px solid #CBD5E1', boxShadow: 'none' }} />
                <Bar dataKey="score" fill="#1E3A8A" radius={[2, 2, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Satisfaction Trend */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Citizen Satisfaction Trend</h2>
            <p className="text-xs text-slate-500">30-day positive verification percentage</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={satisfactionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #CBD5E1', boxShadow: 'none' }} />
                <Line type="monotone" dataKey="rate" stroke="#15803D" strokeWidth={2.5} dot={{ r: 4, fill: '#15803D', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Status Breakdown */}
        <div className="lg:col-span-1 bg-white p-5 rounded-md border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Verification Alignment</h2>
          <p className="text-xs text-slate-500 mb-4">Citizen feedback match rate against reported officer completion</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {verificationStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #CBD5E1', boxShadow: 'none' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Key Observations */}
        <div className="lg:col-span-2 bg-white p-5 rounded-md border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">Municipal Audit Findings</h2>
          <div className="space-y-3">
            <div className="flex gap-3 p-3.5 bg-emerald-50/50 rounded-md border border-emerald-200">
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Sanitation & Waste Improvement</h4>
                <p className="text-xs text-emerald-950 mt-0.5">Resolution quality scores for Ward 12 waste collection grievances rose by +15% following scheduled vehicle reassignment.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3.5 bg-amber-50/50 rounded-md border border-amber-200">
              <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Water Utility Verification Gap</h4>
                <p className="text-xs text-amber-950 mt-0.5">Water pipeline repair complaints show a 32% "Not Fixed" rating in citizen verifications due to incomplete surface resurfacing after pipe repairs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

