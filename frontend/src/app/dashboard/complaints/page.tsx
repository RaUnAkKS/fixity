'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, FileText, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { COMPLAINT_CATEGORIES, Complaint } from '@/lib/types';

const getSeverityColor = (severity: number = 0) => {
  if (severity >= 80) return 'text-red-700 bg-red-50 border-red-200';
  if (severity >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200';
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    submitted: 'bg-slate-100 text-slate-800 border-slate-300',
    analyzing: 'bg-blue-50 text-blue-800 border-blue-200',
    analyzed: 'bg-purple-50 text-purple-800 border-purple-200',
    assigned: 'bg-amber-50 text-amber-800 border-amber-200',
    in_progress: 'bg-orange-50 text-orange-800 border-orange-200',
    resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    verified: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  };
  return styles[status] || 'bg-slate-100 text-slate-800 border-slate-300';
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'FX-1024',
    citizen_id: 'user_1',
    original_text: 'Deep potholes on Karol Bagh main road causing severe traffic congestion.',
    category: 'Road Infrastructure',
    ward_id: 15,
    severity: 85,
    status: 'in_progress',
    latitude: 28.6538,
    longitude: 77.1888,
    created_at: new Date('2026-10-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-10-02T10:00:00Z').toISOString(),
  },
  {
    id: 'FX-1025',
    citizen_id: 'user_2',
    original_text: 'No water supply in Dwarka Sector 12 for the past 3 days.',
    category: 'Water Supply',
    ward_id: 22,
    severity: 90,
    status: 'submitted',
    latitude: 28.5921,
    longitude: 77.0460,
    created_at: new Date('2026-10-03T08:30:00Z').toISOString(),
    updated_at: new Date('2026-10-03T08:30:00Z').toISOString(),
  },
  {
    id: 'FX-1026',
    citizen_id: 'user_3',
    original_text: 'Open drainage overflowing near Chandni Chowk metro station.',
    category: 'Drainage & Sewage',
    ward_id: 8,
    severity: 75,
    status: 'assigned',
    latitude: 28.6562,
    longitude: 77.2315,
    created_at: new Date('2026-10-04T14:15:00Z').toISOString(),
    updated_at: new Date('2026-10-05T09:00:00Z').toISOString(),
  },
  {
    id: 'FX-1027',
    citizen_id: 'user_4',
    original_text: 'Garbage dump hasn\'t been cleared for a week in Vasant Kunj.',
    category: 'Sanitation & Waste',
    ward_id: 30,
    severity: 65,
    status: 'resolved',
    latitude: 28.5293,
    longitude: 77.1531,
    created_at: new Date('2026-09-28T11:20:00Z').toISOString(),
    updated_at: new Date('2026-10-02T16:45:00Z').toISOString(),
  },
  {
    id: 'FX-1028',
    citizen_id: 'user_5',
    original_text: 'Streetlights not working on Hauz Khas main road.',
    category: 'Electricity',
    ward_id: 12,
    severity: 45,
    status: 'analyzed',
    latitude: 28.5494,
    longitude: 77.2001,
    created_at: new Date('2026-10-05T19:00:00Z').toISOString(),
    updated_at: new Date('2026-10-05T19:05:00Z').toISOString(),
  },
  {
    id: 'FX-1029',
    citizen_id: 'user_6',
    original_text: 'Illegal construction blocking the pavement in Lajpat Nagar.',
    category: 'Building & Construction',
    ward_id: 18,
    severity: 55,
    status: 'analyzing',
    latitude: 28.5677,
    longitude: 77.2433,
    created_at: new Date('2026-10-06T09:10:00Z').toISOString(),
    updated_at: new Date('2026-10-06T09:10:00Z').toISOString(),
  },
  {
    id: 'FX-1030',
    citizen_id: 'user_7',
    original_text: 'Stray dog menace near primary school in Rohini Sector 7.',
    category: 'Public Safety',
    ward_id: 5,
    severity: 60,
    status: 'verified',
    latitude: 28.7159,
    longitude: 77.1171,
    created_at: new Date('2026-09-25T08:00:00Z').toISOString(),
    updated_at: new Date('2026-10-01T14:30:00Z').toISOString(),
  },
  {
    id: 'FX-1031',
    citizen_id: 'user_8',
    original_text: 'Severe air pollution due to waste burning in Okhla industrial area.',
    category: 'Pollution',
    ward_id: 25,
    severity: 95,
    status: 'submitted',
    latitude: 28.5273,
    longitude: 77.2798,
    created_at: new Date('2026-10-06T15:20:00Z').toISOString(),
    updated_at: new Date('2026-10-06T15:20:00Z').toISOString(),
  },
  {
    id: 'FX-1032',
    citizen_id: 'user_9',
    original_text: 'Broken swings in the neighborhood park in Pitampura.',
    category: 'Parks & Recreation',
    ward_id: 3,
    severity: 35,
    status: 'assigned',
    latitude: 28.7031,
    longitude: 77.1323,
    created_at: new Date('2026-10-02T17:45:00Z').toISOString(),
    updated_at: new Date('2026-10-04T10:15:00Z').toISOString(),
  },
  {
    id: 'FX-1033',
    citizen_id: 'user_10',
    original_text: 'Local dispensary out of essential medicines in Seelampur.',
    category: 'Healthcare',
    ward_id: 9,
    severity: 88,
    status: 'in_progress',
    latitude: 28.6640,
    longitude: 77.2714,
    created_at: new Date('2026-10-04T11:00:00Z').toISOString(),
    updated_at: new Date('2026-10-05T13:20:00Z').toISOString(),
  }
];

export default function ComplaintsPage() {
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const filteredComplaints = MOCK_COMPLAINTS.filter(c => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.id.toLowerCase().includes(q) || c.original_text.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Municipal Operations
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Complaints Registry & Dispatch
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">Official citywide record of registered public grievances.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or keywords..." 
            className="pl-9 pr-3 py-1.5 w-full border border-slate-300 rounded bg-white text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 bg-white p-3.5 rounded-md border border-slate-200 text-xs items-center">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          Filter Registry:
        </div>
        
        <select 
          className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-700 focus:outline-none"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {COMPLAINT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-700 focus:outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="analyzing">Analyzing</option>
          <option value="analyzed">Analyzed</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="verified">Verified</option>
        </select>

        {(filterCategory || filterStatus || searchQuery) && (
          <button 
            onClick={() => { setFilterCategory(''); setFilterStatus(''); setSearchQuery(''); }}
            className="text-xs font-semibold text-blue-700 hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Case ID</th>
                <th className="px-4 py-3">Grievance Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date Registered</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredComplaints.map(complaint => (
                <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{complaint.id}</td>
                  <td className="px-4 py-3 max-w-xs truncate font-medium text-slate-800" title={complaint.original_text}>
                    {complaint.original_text}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{complaint.category}</td>
                  <td className="px-4 py-3 text-slate-600">Ward {complaint.ward_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityColor(complaint.severity)}`}>
                      {complaint.severity}/100
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(complaint.status)}`}>
                      {formatStatus(complaint.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/complaints/${complaint.id}`}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      View Record
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No complaint records found matching the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs text-slate-600">
          <span>Showing {filteredComplaints.length} registered entries</span>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-600 disabled:opacity-50">
              Prev
            </button>
            <button disabled className="px-3 py-1 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-600 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
