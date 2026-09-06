'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { MapPin, Layers, Loader2, AlertCircle, Shield } from 'lucide-react';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import('@/components/map/MapView'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2">
        <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
        <span className="text-xs">Rendering geospatial coordinate layers...</span>
      </div>
    )
  }
);

interface ComplaintResponse {
  id: string;
  latitude: number | null;
  longitude: number | null;
  severity: number;
}

interface HotspotPoint {
  lat: number;
  lng: number;
  weight: number;
}

export default function HeatmapPage() {
  const [points, setPoints] = useState<HotspotPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchMapData() {
      try {
        setLoading(true);
        const data = await api.get<any>('/api/complaints?limit=100');
        let items: ComplaintResponse[] = [];
        
        if (data && Array.isArray(data.items)) {
          items = data.items;
        } else if (Array.isArray(data)) {
          items = data;
        }

        const validPoints = items
          .filter(item => item.latitude != null && item.longitude != null)
          .map(item => ({
            lat: Number(item.latitude),
            lng: Number(item.longitude),
            weight: item.severity ? item.severity / 100 : 0.5
          }));

        setPoints(validPoints);
        setTotalCount(items.length);
      } catch (err: any) {
        console.error('Failed to fetch map data', err);
        setError('Failed to load map data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMapData();
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-xs">
      {/* Sidebar Controls */}
      <div className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 p-5 flex flex-col justify-between z-10 space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-700" />
              Incident Heatmap
            </h1>
            <p className="text-xs text-slate-400 mt-1">Geospatial concentration of municipal complaints</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
              <Loader2 className="h-4 w-4 text-blue-700 animate-spin" />
              <span>Analyzing coordinates...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          ) : (
            <>
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Analyzed</span>
                <p className="text-2xl font-black text-slate-900">{totalCount}</p>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {points.length} GPS geocoded pins
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Severity Heat Distribution
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      Critical Hazard (&gt;65)
                    </span>
                    <span className="text-[11px] opacity-80">High Density</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Medium Issue (35-65)
                    </span>
                    <span className="text-[11px] opacity-80">Moderate</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      Low Priority (&lt;35)
                    </span>
                    <span className="text-[11px] opacity-80">Routine</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          Powered by OpenStreetMap &amp; Leaflet geospatial engine.
        </div>
      </div>
      
      {/* Map View */}
      <div className="flex-1 relative bg-slate-100 min-h-[350px]">
        <MapView center={[28.6139, 77.2090]} zoom={12} hotspots={points} height="100%" />
      </div>
    </div>
  );
}

