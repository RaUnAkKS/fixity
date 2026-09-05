'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Image as ImageIcon, 
  MessageSquare, AlertTriangle, ShieldCheck, Tag, Loader2,
  CheckCircle2, Info, Building2, CheckSquare
} from 'lucide-react';
import { 
  getStatusColor, 
  getStatusLabel, 
  getSeverityLabel, 
  formatDate 
} from '@/lib/utils';

// Types
interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  description: string;
  actor?: string;
}

interface ComplaintDetail {
  id: string;
  text: string;
  translatedText?: string;
  originalLanguage?: string;
  category: string;
  subcategory: string;
  severity: number;
  status: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  address: string;
  department: string;
  issues: string[];
  confidenceScore: number;
  clusterId?: string;
  clusterSize?: number;
  evidence: string[];
  timeline: TimelineEvent[];
}

const MOCK_DETAIL: ComplaintDetail = {
  id: 'FX-1001',
  text: 'यहां मुख्य सड़क पर एक बहुत बड़ा गड्ढा है जो 2 हफ्ते से है और रोज ट्रैफिक जाम करता है। कृपया इसे जल्द ठीक करें।',
  translatedText: 'There is a huge pothole on the main road here which has been there for 2 weeks and causes traffic jam everyday. Please fix it soon.',
  originalLanguage: 'Hindi (hi)',
  category: 'Road Infrastructure',
  subcategory: 'Pothole & Asphalt Repair',
  severity: 78,
  status: 'in_progress',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  latitude: 12.9716,
  longitude: 77.5946,
  address: 'MG Road, Near Central Market & Metro Station, Ward 12',
  department: 'Public Works Department (PWD)',
  issues: ['Safety Hazard', 'Traffic Congestion', 'Infrastructure Damage'],
  confidenceScore: 0.94,
  clusterId: 'CLS-592',
  clusterSize: 4,
  evidence: ['/mock-evidence-1.jpg', '/mock-evidence-2.jpg'],
  timeline: [
    {
      id: 'evt-1',
      status: 'submitted',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Complaint registered by citizen via Fixity portal.',
    },
    {
      id: 'evt-2',
      status: 'analyzed',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
      description: 'Automated classification completed. Categorized under Road Infrastructure with 78/100 severity.',
      actor: 'Fixity Classifier'
    },
    {
      id: 'evt-3',
      status: 'assigned',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Dispatched to Public Works Department (Ward 12 Engineering Division).',
      actor: 'Auto-Dispatcher'
    },
    {
      id: 'evt-4',
      status: 'in_progress',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Field inspection completed by Municipal Engineer. Resurfacing scheduled.',
      actor: 'Engineer R. Kumar (PWD)'
    }
  ]
};

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = () => {
      setTimeout(() => {
        setComplaint({ ...MOCK_DETAIL, id: (params.id as string) || 'FX-1001' });
        setLoading(false);
      }, 400);
    };
    fetchDetail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto px-4">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-3" />
        <p className="text-xs text-slate-600">Retrieving official case file record...</p>
      </div>
    );
  }

  if (!complaint) return <div className="text-center py-12 text-xs text-slate-600">Municipal Complaint File Not Found</div>;

  const sev = complaint.severity ?? 0;
  const severityBadgeColor = sev <= 30 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : sev <= 60 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-red-50 text-red-800 border-red-300';

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Grievance Registry
        </button>

        {/* Case File Header */}
        <div className="bg-white rounded-md border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  CASE FILE #{complaint.id}
                </span>
                <span className="text-xs text-slate-500 font-medium">| Official Municipal Record</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{complaint.category}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded text-xs font-bold border ${getStatusColor(complaint.status)}`}>
                {getStatusLabel(complaint.status)}
              </span>
              <span className={`px-3 py-1 rounded text-xs font-bold border ${severityBadgeColor}`}>
                Severity: {getSeverityLabel(complaint.severity)} ({complaint.severity}/100)
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Registration Date: <strong>{formatDate(complaint.createdAt)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location: <strong>{complaint.address}</strong></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Details (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Statement of Complaint */}
            <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-700" />
                Citizen Grievance Statement
              </h2>
              
              {complaint.translatedText ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-blue-50/70 border border-blue-200 rounded p-3 text-slate-900">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">English Translation</span>
                    <p className="leading-relaxed">{complaint.translatedText}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Original Statement ({complaint.originalLanguage})</span>
                    <p className="leading-relaxed">{complaint.text}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-900 leading-relaxed">
                  {complaint.text}
                </div>
              )}
            </div>

            {/* Department Routing & Classification */}
            <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-700" />
                Department Assignment & Assessment
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">Assigned Department</span>
                  <span className="font-bold text-slate-900">{complaint.department}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">Subcategory</span>
                  <span className="font-bold text-slate-900">{complaint.subcategory}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Calculated Severity Index</span>
                  <span className="font-bold text-slate-900">{complaint.severity}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-blue-700"
                    style={{ width: `${complaint.severity}%` }}
                  />
                </div>
              </div>

              <div className="text-xs">
                <span className="font-semibold text-slate-800 block mb-1.5">Identified Issue Markers</span>
                <div className="flex flex-wrap gap-1.5">
                  {complaint.issues.map(issue => (
                    <span key={issue} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Evidence Photos */}
            <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-700" />
                Attached Evidence Files
              </h2>
              {complaint.evidence && complaint.evidence.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.evidence.map((ev, i) => (
                    <div key={i} className="aspect-video bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">
                      <span>Photo Evidence #{i+1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs">No photographic evidence attached.</p>
              )}
            </div>

            {/* Verification Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-blue-900 block">Citizen Resolution Verification</span>
                <span className="text-blue-700">Once repairs are complete, verify the work to confirm case resolution.</span>
              </div>
              <Link
                href={`/complaints/${complaint.id}/verify`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-blue-700 text-white rounded font-bold text-xs hover:bg-blue-800 transition-colors shrink-0"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Verify Resolution
              </Link>
            </div>

          </div>

          {/* Timeline Sidebar (1 Col) */}
          <div className="space-y-6">
            
            {/* Cluster Alert */}
            {complaint.clusterId && (
              <div className="bg-amber-50 rounded-md border border-amber-300 p-4 text-xs">
                <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  Cluster Detected (#{complaint.clusterId})
                </h3>
                <p className="text-amber-800 leading-relaxed">
                  Part of a cluster with <strong>{complaint.clusterSize}</strong> related complaints in Ward 12. Combined for department action.
                </p>
              </div>
            )}

            {/* Case History Timeline */}
            <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-700" />
                Case History & Timeline
              </h2>
              
              <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 text-xs">
                {complaint.timeline.map((event) => (
                  <div key={event.id} className="relative pl-5">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-700 ring-4 ring-white" />
                    
                    <div className="font-bold text-slate-900">
                      {getStatusLabel(event.status)}
                    </div>
                    <div className="text-[10px] text-slate-500 mb-1">
                      {formatDate(event.timestamp)}
                    </div>
                    <p className="text-slate-700 bg-slate-50 rounded p-2 border border-slate-200 text-[11px] leading-normal">
                      {event.description}
                    </p>
                    {event.actor && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Officer/System: {event.actor}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
