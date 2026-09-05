'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, MapPin, Calendar, AlertTriangle, Loader2, Building2 } from 'lucide-react';
import { Complaint } from '@/lib/types';
import { 
  getStatusColor, 
  getStatusLabel, 
  getSeverityLabel, 
  formatDate, 
  truncateText 
} from '@/lib/utils';

// Mock Data
const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'FX-1001',
    citizen_id: 'cit-1',
    original_text: 'Huge pothole on Main Street near the central market. It has been there for 2 weeks and causes traffic jams everyday.',
    category: 'Road Infrastructure',
    severity: 75,
    status: 'in_progress',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    latitude: 12.9716,
    longitude: 77.5946
  },
  {
    id: 'FX-1002',
    citizen_id: 'cit-1',
    original_text: 'No water supply in Sector 4 for the last two days. Residents are facing severe hardship.',
    category: 'Water Supply',
    severity: 90,
    status: 'assigned',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    latitude: 12.9352,
    longitude: 77.6245
  },
  {
    id: 'FX-1003',
    citizen_id: 'cit-1',
    original_text: 'Streetlights are not working in the park avenue area. It is completely dark at night and feels unsafe.',
    category: 'Electricity',
    severity: 45,
    status: 'analyzed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    latitude: 13.0012,
    longitude: 77.5566
  },
  {
    id: 'FX-1004',
    citizen_id: 'cit-1',
    original_text: 'Garbage not collected for a week near the community center. Foul smell is spreading.',
    category: 'Sanitation & Waste',
    severity: 65,
    status: 'submitted',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    latitude: 12.9854,
    longitude: 77.5342
  },
  {
    id: 'FX-1005',
    citizen_id: 'cit-1',
    original_text: 'Stray dogs are chasing vehicles on 3rd cross road. Someone might get hurt.',
    category: 'Public Safety',
    severity: 25,
    status: 'resolved',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    latitude: 12.9234,
    longitude: 77.5841
  }
];

export default function MyComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      setTimeout(() => {
        setComplaints(MOCK_COMPLAINTS);
        setLoading(false);
      }, 500);
    };
    fetchComplaints();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto px-4">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-3" />
        <p className="text-xs text-slate-600">Loading complaint records...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white rounded-md border border-slate-200 p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Building2 className="h-4 w-4" /> Public Grievance Records
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Complaints Registry</h1>
            <p className="text-xs text-slate-600 mt-1">Track resolution status and municipal department assignments.</p>
          </div>
          <Link 
            href="/report" 
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-md text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Report New Issue
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-12 text-center shadow-sm">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No Filed Complaints Found</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4">
              You currently have no active or historical civic grievances registered.
            </p>
            <Link 
              href="/report"
              className="inline-flex items-center text-xs font-bold text-blue-700 hover:underline"
            >
              File a new complaint
              <Plus className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs text-slate-700 font-semibold">
              <span>Showing {complaints.length} Filed Grievances</span>
              <span className="text-slate-500">Click any row to open official Case File</span>
            </div>

            <div className="divide-y divide-slate-200">
              {complaints.map((complaint) => {
                const sev = complaint.severity ?? 0;
                const severityBadgeColor = sev <= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : sev <= 60 ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-red-50 text-red-700 border-red-300';
                
                return (
                  <div 
                    key={complaint.id}
                    onClick={() => router.push(`/complaints/${complaint.id}`)}
                    className="p-5 cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {complaint.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusColor(complaint.status)}`}>
                            {getStatusLabel(complaint.status)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {complaint.category || 'General'}
                          </span>
                        </div>
                        
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors leading-relaxed">
                          {truncateText(complaint.original_text, 140)}
                        </p>
                        
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Filed: {formatDate(complaint.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            GPS Coordinates Attached
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500 font-medium">Assigned Severity</div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${severityBadgeColor}`}>
                            {getSeverityLabel(sev)} ({sev}/100)
                          </span>
                        </div>

                        <span className="text-xs font-bold text-blue-700 group-hover:underline">
                          View File →
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
