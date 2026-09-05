'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { FolderKanban, CheckCircle2, Play, ArrowRight, BarChart3, AlertTriangle, Building2 } from 'lucide-react';
import type { ProjectDetail, ImpactMeasurement } from '@/lib/types';

const MOCK_PROJECT_DETAIL = {
  id: 'proj_1',
  title: 'Main Road Resurfacing Project',
  description: 'Comprehensive resurfacing of the 2.5km stretch on Main Road to resolve recurring severe pothole clusters. Includes fixing subsurface drainage.',
  category: 'Road Infrastructure',
  ward: 'Ward 7',
  status: 'Planned',
  cost: 1500000,
  affected_population: 12500,
  complaints: [
    { id: 'FX-1024', title: 'Huge pothole near junction', severity: 9, date: '2026-10-01' },
    { id: 'FX-1025', title: 'Car damaged due to pothole', severity: 8, date: '2026-10-03' },
    { id: 'FX-1026', title: 'Multiple potholes on this stretch', severity: 8, date: '2026-10-05' }
  ],
  impact: {
    before_severity: 8.5,
    projected_after_severity: 2.1
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string || 'proj_1';
  const project = MOCK_PROJECT_DETAIL;

  return (
    <div className="space-y-6 bg-slate-50 text-xs">
      
      {/* Header & Status Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 uppercase">
              {project.status}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">PROJECT ID: {id}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approve Sanction
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded text-xs transition-colors shadow-sm">
            <Play className="w-3.5 h-3.5" /> Start Work Execution
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-blue-700" /> Municipal Project Specification
            </h2>
            <p className="text-slate-700 mb-4 leading-relaxed">{project.description}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Category</div>
                <div className="font-bold text-slate-900">{project.category}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Ward Location</div>
                <div className="font-bold text-slate-900">{project.ward}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Est. Budget</div>
                <div className="font-bold text-slate-900 font-mono">₹{project.cost.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Beneficiaries</div>
                <div className="font-bold text-slate-900">{project.affected_population.toLocaleString()} citizens</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Merged Citizen Grievance Files
            </h2>
            <div className="space-y-2">
              {project.complaints.map(complaint => (
                <div key={complaint.id} className="flex items-center justify-between p-3 border border-slate-200 rounded bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">{complaint.title}</h4>
                    <p className="text-[10px] text-slate-500">File #{complaint.id} • Registered on {complaint.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded">
                      Sev: {complaint.severity}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Impact */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-700" /> Impact Forecast
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 rounded border border-amber-300">
                Illustrative prototype metric
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Before Work (Current Severity)</span>
                  <span className="text-red-700 font-mono font-bold">{project.impact.before_severity}/10</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-red-600 rounded-full" 
                    style={{ width: `${(project.impact.before_severity / 10) * 100}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">After Work (Projected Severity)</span>
                  <span className="text-emerald-700 font-mono font-bold">{project.impact.projected_after_severity}/10</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-emerald-600 rounded-full" 
                    style={{ width: `${(project.impact.projected_after_severity / 10) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
