'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, AlertTriangle, Star, CheckCircle2, Building2 } from 'lucide-react';

export default function ImpactViewPage() {
  const params = useParams();
  const id = params.id as string;

  const mockImpact = {
    beforeSeverity: 85,
    afterSeverity: 35,
    improvementPercentage: 59,
    confidence: 'high' as const,
    factors: [
      'Pothole size reduced by 100%',
      'Traffic flow restored to normal velocity',
      'Accident risk index lowered significantly',
      'Drainage overflow unblocked'
    ],
    verification: {
      rating: 4,
      comment: "The hole is filled, but the surface is a bit uneven. Still, much better than before.",
      status: "Partially improved",
      date: "2026-09-02"
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        <div className="flex items-center justify-between">
          <Link 
            href={`/complaints/${id}`}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to Case File #{id}
          </Link>
          <Link
            href={`/complaints/${id}/verify`}
            className="text-xs font-bold text-blue-700 hover:underline"
          >
            Submit Resolution Verification →
          </Link>
        </div>

        <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                <Building2 className="h-4 w-4" /> Municipal Resolution Assessment
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Resolution Impact Analysis</h1>
              <p className="text-xs text-slate-600 mt-1">Calculated before/after severity delta and citizen verification score.</p>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded border border-amber-300 text-xs font-semibold shrink-0">
              <AlertTriangle size={14} className="text-amber-700" />
              Illustrative prototype metric
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-700" />
              Severity Score Delta Comparison
            </h2>
            
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Before Municipal Repair</span>
                  <span className="text-red-700 font-mono font-bold">{mockImpact.beforeSeverity}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-red-600 h-3 rounded-full"
                    style={{ width: `${mockImpact.beforeSeverity}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">After Completed Repair</span>
                  <span className="text-emerald-700 font-mono font-bold">{mockImpact.afterSeverity}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-emerald-600 h-3 rounded-full"
                    style={{ width: `${mockImpact.afterSeverity}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center justify-center mb-3">
              <TrendingDown size={24} />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono mb-1">
              -{mockImpact.improvementPercentage}%
            </div>
            <div className="text-xs font-bold text-slate-700">
              Severity Reduction
            </div>
            <div className="mt-3 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 uppercase">
              {mockImpact.confidence} Confidence Level
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Factors */}
          <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-700" />
              Measured Resolution Factors
            </h3>
            <ul className="space-y-2.5 text-xs">
              {mockImpact.factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-800">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Verification Summary */}
          <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              Citizen Verification Record
            </h3>
            
            <div className="mb-3">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={star <= mockImpact.verification.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}
                  />
                ))}
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                Status: {mockImpact.verification.status}
              </span>
            </div>
            
            <blockquote className="border-l-2 border-slate-300 pl-3 py-1 mb-2 text-xs text-slate-700 italic bg-slate-50 rounded-r">
              &quot;{mockImpact.verification.comment}&quot;
            </blockquote>
            
            <div className="text-[11px] text-slate-500">
              Verified on {mockImpact.verification.date}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
