'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSeverityColor, getSeverityLabel, formatDate } from '@/lib/utils';
import { Layers, ChevronDown, ChevronUp, AlertCircle, Loader2, ArrowRight, Tag } from 'lucide-react';

interface ComplaintResponse {
  id: string;
  original_text: string;
  category: string;
  severity: number;
  status: string;
  created_at: string;
  address?: string;
}

interface ClusterGroup {
  category: string;
  count: number;
  avgSeverity: number;
  topComplaints: ComplaintResponse[];
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClusters() {
      try {
        setLoading(true);
        const data = await api.get<any>('/api/complaints?limit=100');
        let items: ComplaintResponse[] = [];

        
        if (data && Array.isArray(data.items)) {
          items = data.items;
        } else if (Array.isArray(data)) {
          items = data;
        }

        const groups = new Map<string, ComplaintResponse[]>();
        
        items.forEach(item => {
          const cat = item.category || 'Uncategorized';
          if (!groups.has(cat)) {
            groups.set(cat, []);
          }
          groups.get(cat)!.push(item);
        });

        const clusterArray: ClusterGroup[] = Array.from(groups.entries()).map(([category, complaints]) => {
          const totalSeverity = complaints.reduce((sum, c) => sum + (c.severity || 0), 0);
          return {
            category,
            count: complaints.length,
            avgSeverity: complaints.length > 0 ? totalSeverity / complaints.length : 0,
            topComplaints: complaints.sort((a, b) => (b.severity || 0) - (a.severity || 0)).slice(0, 5)
          };
        });

        clusterArray.sort((a, b) => b.count - a.count);
        setClusters(clusterArray);
        if (clusterArray.length > 0) {
          setExpandedCluster(clusterArray[0].category);
        }

      } catch (err: any) {
        console.error('Failed to fetch cluster data', err);
        setError('Failed to load issue cluster analysis.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClusters();
  }, []);

  const toggleCluster = (category: string) => {
    if (expandedCluster === category) {
      setExpandedCluster(null);
    } else {
      setExpandedCluster(category);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-700" />
          Recurring Issue Clusters
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Algorithmic grouping of municipal incidents by frequency, root causes, and average hazard severity
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
          <span className="text-xs text-slate-500">Computing incident cluster vectors...</span>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : clusters.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          No recurring issue clusters identified in the current municipal dataset.
        </div>
      ) : (
        <div className="space-y-3.5">
          {clusters.map((cluster) => {
            const isExpanded = expandedCluster === cluster.category;
            const avg = Math.round(cluster.avgSeverity);

            return (
              <div key={cluster.category} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
                  onClick={() => toggleCluster(cluster.category)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-sm font-bold text-slate-900">{cluster.category}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        avg > 65 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        avg > 35 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Avg Sev: {avg}/100 ({getSeverityLabel(avg)})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {cluster.count} incident reports grouped in this department cluster
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-5 bg-slate-50/60 border-t border-slate-100 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Top Severity Complaints in this Cluster
                    </span>
                    <div className="grid gap-2.5">
                      {cluster.topComplaints.map(complaint => (
                        <Link
                          key={complaint.id}
                          href={`/complaints/${complaint.id}`}
                          className="bg-white p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400">#{complaint.id.substring(0,8)}</span>
                              <span className={`px-2 py-0.2 text-[10px] font-bold rounded-full border ${getSeverityColor(complaint.severity || 0)}`}>
                                Severity {complaint.severity || 0}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                              {complaint.original_text}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 shrink-0">
                            <span>Inspect</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

