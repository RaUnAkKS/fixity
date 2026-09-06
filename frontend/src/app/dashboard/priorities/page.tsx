'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, MapPin, Filter, Building2 } from 'lucide-react';
import { COMPLAINT_CATEGORIES, PriorityScore } from '@/lib/types';

const MOCK_PRIORITIES: PriorityScore[] = [
  {
    id: 'p1',
    ward_id: 25,
    ward_name: 'Okhla Ward',
    total_score: 92,
    demand_score: 95,
    severity_score: 88,
    population_score: 90,
    infrastructure_gap_score: 94,
    unresolved_score: 93,
  },
  {
    id: 'p2',
    ward_id: 22,
    ward_name: 'Dwarka Ward',
    total_score: 85,
    demand_score: 82,
    severity_score: 89,
    population_score: 85,
    infrastructure_gap_score: 78,
    unresolved_score: 91,
  },
  {
    id: 'p3',
    ward_id: 9,
    ward_name: 'Seelampur Ward',
    total_score: 81,
    demand_score: 75,
    severity_score: 85,
    population_score: 95,
    infrastructure_gap_score: 88,
    unresolved_score: 62,
  },
  {
    id: 'p4',
    ward_id: 15,
    ward_name: 'Karol Bagh Ward',
    total_score: 74,
    demand_score: 88,
    severity_score: 70,
    population_score: 75,
    infrastructure_gap_score: 65,
    unresolved_score: 72,
  },
  {
    id: 'p5',
    ward_id: 8,
    ward_name: 'Chandni Chowk Ward',
    total_score: 68,
    demand_score: 60,
    severity_score: 75,
    population_score: 80,
    infrastructure_gap_score: 72,
    unresolved_score: 53,
  },
  {
    id: 'p6',
    ward_id: 30,
    ward_name: 'Vasant Kunj Ward',
    total_score: 55,
    demand_score: 45,
    severity_score: 50,
    population_score: 40,
    infrastructure_gap_score: 60,
    unresolved_score: 80,
  },
  {
    id: 'p7',
    ward_id: 12,
    ward_name: 'Hauz Khas Ward',
    total_score: 42,
    demand_score: 35,
    severity_score: 40,
    population_score: 45,
    infrastructure_gap_score: 30,
    unresolved_score: 60,
  },
  {
    id: 'p8',
    ward_id: 3,
    ward_name: 'Pitampura Ward',
    total_score: 38,
    demand_score: 40,
    severity_score: 35,
    population_score: 50,
    infrastructure_gap_score: 25,
    unresolved_score: 40,
  }
];

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-red-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-emerald-700';
};

const ProgressBar = ({ label, score, colorClass }: { label: string, score: number, colorClass: string }) => (
  <div className="flex items-center gap-3 text-xs">
    <div className="w-32 font-semibold text-slate-700 truncate" title={label}>
      {label}
    </div>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
      <div 
        className={`h-full rounded-full ${colorClass}`} 
        style={{ width: `${score}%` }}
      />
    </div>
    <div className="w-8 font-mono font-bold text-slate-900 text-right">
      {score}
    </div>
  </div>
);

export default function PriorityAreasPage() {
  const [filterCategory, setFilterCategory] = useState<string>('');

  return (
    <div className="space-y-6 bg-slate-50">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Priority Assessment System
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Ward Priority Index
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Formulaic ranking of municipal wards requiring immediate intervention.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-300 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select 
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MOCK_PRIORITIES.map((priority, index) => (
          <div 
            key={priority.id} 
            className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-slate-900 text-white text-xs font-bold">
                    #{index + 1}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {priority.ward_name} (Ward {priority.ward_id})
                  </h2>
                </div>
                {priority.total_score >= 80 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    <AlertTriangle className="h-3 w-3" /> Critical Attention Needed
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Priority Index</div>
                <div className={`text-3xl font-mono font-bold ${getScoreColor(priority.total_score)}`}>
                  {priority.total_score}
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-2.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Multi-Factor Score Breakdown
              </h3>
              <ProgressBar label="Demand Index" score={priority.demand_score} colorClass="bg-blue-700" />
              <ProgressBar label="Severity Score" score={priority.severity_score} colorClass="bg-red-600" />
              <ProgressBar label="Population Density" score={priority.population_score} colorClass="bg-purple-600" />
              <ProgressBar label="Infrastructure Gap" score={priority.infrastructure_gap_score} colorClass="bg-amber-600" />
              <ProgressBar label="Unresolved Rate" score={priority.unresolved_score} colorClass="bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
