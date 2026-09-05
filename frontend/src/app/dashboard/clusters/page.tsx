'use client';

import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Tag, Building2 } from 'lucide-react';

const MOCK_CLUSTERS = [
  {
    id: 'c1',
    representative_text: 'Severe pothole issue on Main Road causing accidents',
    category: 'Road Infrastructure',
    complaint_count: 45,
    avg_severity: 8.5,
    complaints: [
      { id: '1', title: 'Huge pothole near junction', severity: 9 },
      { id: '2', title: 'Car damaged due to pothole', severity: 8 },
      { id: '3', title: 'Multiple potholes on this stretch', severity: 8 }
    ]
  },
  {
    id: 'c2',
    representative_text: 'No water supply for 3 days in Ward 7',
    category: 'Water Supply',
    complaint_count: 32,
    avg_severity: 9.2,
    complaints: [
      { id: '4', title: 'Water missing since Monday', severity: 9 },
      { id: '5', title: 'Contaminated water earlier, now none', severity: 10 },
      { id: '6', title: 'Need tanker immediately', severity: 8 }
    ]
  },
  {
    id: 'c3',
    representative_text: 'Streetlights not working on 5th Avenue',
    category: 'Electricity',
    complaint_count: 18,
    avg_severity: 6.5,
    complaints: [
      { id: '7', title: 'Pitch dark at night', severity: 6 },
      { id: '8', title: 'Safety issue due to no lights', severity: 7 },
      { id: '9', title: 'Bulb fused on pole 42', severity: 5 }
    ]
  },
  {
    id: 'c4',
    representative_text: 'Garbage not collected for a week',
    category: 'Sanitation & Waste',
    complaint_count: 27,
    avg_severity: 7.8,
    complaints: [
      { id: '10', title: 'Overflowing bins', severity: 8 },
      { id: '11', title: 'Foul smell in neighborhood', severity: 8 },
      { id: '12', title: 'Stray dogs gathering', severity: 7 }
    ]
  },
  {
    id: 'c5',
    representative_text: 'Blocked drainage overflowing onto road',
    category: 'Drainage & Sewage',
    complaint_count: 22,
    avg_severity: 8.9,
    complaints: [
      { id: '13', title: 'Sewage water entering homes', severity: 10 },
      { id: '14', title: 'Health hazard due to dirty water', severity: 9 },
      { id: '15', title: 'Drain clogged with plastic', severity: 8 }
    ]
  },
  {
    id: 'c6',
    representative_text: 'Illegal parking blocking pedestrian path',
    category: 'Public Safety',
    complaint_count: 15,
    avg_severity: 5.5,
    complaints: [
      { id: '16', title: 'Cars parked on footpath', severity: 6 },
      { id: '17', title: 'Cannot walk safely', severity: 5 },
      { id: '18', title: 'Traffic jam due to parking', severity: 6 }
    ]
  }
];

export default function ClustersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 bg-slate-50">
      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <Building2 className="h-4 w-4" /> Issue Aggregation Engine
        </div>
        <h1 className="text-xl font-bold text-slate-900">Municipal Complaint Clusters</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Grouped grievance clusters automatically merged based on geographic proximity and topic similarity.
        </p>
      </div>

      <div className="space-y-3">
        {MOCK_CLUSTERS.map((cluster) => (
          <div key={cluster.id} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {cluster.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      cluster.avg_severity >= 8 ? 'bg-red-50 text-red-700 border-red-200' :
                      cluster.avg_severity >= 6 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      Avg. Severity: {cluster.avg_severity.toFixed(1)}/10
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{cluster.representative_text}</h3>
                </div>

                <div className="text-center px-4 py-1.5 bg-slate-100 rounded border border-slate-200 shrink-0">
                  <div className="text-xl font-bold font-mono text-slate-900">{cluster.complaint_count}</div>
                  <div className="text-[10px] font-semibold text-slate-600">Merged Files</div>
                </div>
              </div>
              
              <button 
                onClick={() => toggleExpand(cluster.id)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
              >
                {expandedId === cluster.id ? 'Collapse Complaint List' : 'View Merged Complaints'}
                {expandedId === cluster.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {expandedId === cluster.id && (
              <div className="bg-slate-50 p-4 border-t border-slate-200">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Individual Linked Grievances</h4>
                <div className="space-y-2">
                  {cluster.complaints.map(complaint => (
                    <div key={complaint.id} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-medium">{complaint.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        complaint.severity >= 8 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Severity: {complaint.severity}/10
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
