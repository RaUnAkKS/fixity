'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map, Filter, MapPin, Building2, Flame } from 'lucide-react';
import { COMPLAINT_CATEGORIES, HotspotPoint } from '@/lib/types';

const MapComponent = dynamic(() => import('@/components/map/MapView'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded border border-slate-200">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
        <p className="text-slate-600 text-xs font-semibold">Loading Map & Geospatial Hotspots...</p>
      </div>
    </div>
  )
});

const MOCK_HOTSPOTS: HotspotPoint[] = [
  { lat: 28.6538, lng: 77.1888, weight: 0.85 }, // Karol Bagh
  { lat: 28.5921, lng: 77.0460, weight: 0.90 }, // Dwarka
  { lat: 28.6562, lng: 77.2315, weight: 0.75 }, // Chandni Chowk
  { lat: 28.5293, lng: 77.1531, weight: 0.65 }, // Vasant Kunj
  { lat: 28.5494, lng: 77.2001, weight: 0.45 }, // Hauz Khas
  { lat: 28.5677, lng: 77.2433, weight: 0.55 }, // Lajpat Nagar
  { lat: 28.7159, lng: 77.1171, weight: 0.60 }, // Rohini
  { lat: 28.5273, lng: 77.2798, weight: 0.95 }, // Okhla
  { lat: 28.7031, lng: 77.1323, weight: 0.35 }, // Pitampura
  { lat: 28.6640, lng: 77.2714, weight: 0.88 }, // Seelampur
  { lat: 28.6304, lng: 77.2177, weight: 0.70 }, // Connaught Place
  { lat: 28.5823, lng: 77.2233, weight: 0.50 }, // INA
  { lat: 28.6139, lng: 77.2090, weight: 0.40 }, // India Gate
  { lat: 28.6505, lng: 77.2303, weight: 0.80 }, // Jama Masjid
  { lat: 28.5355, lng: 77.2410, weight: 0.68 }, // Nehru Place
];

export default function HeatmapPage() {
  const [filterCategory, setFilterCategory] = useState<string>('');

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)] bg-white overflow-hidden rounded-md border border-slate-200 shadow-sm">
      {/* Map Area */}
      <div className="flex-1 h-full p-4 bg-slate-50 relative">
        <div className="absolute top-6 left-6 z-10 bg-white p-3 rounded border border-slate-300 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5" /> Fixity Geospatial Analysis
          </div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
            City Issue Density Map
          </h1>
          <p className="text-[11px] text-slate-500">Live complaint hotspots across municipal wards</p>
        </div>
        
        <div className="h-full w-full rounded border border-slate-300 overflow-hidden bg-white">
          <MapComponent center={[28.6139, 77.2090]} zoom={11} hotspots={MOCK_HOTSPOTS} />
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="w-full md:w-[300px] h-full border-l border-slate-200 bg-white flex flex-col z-20">
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-300">
            <Flame className="h-4 w-4 text-amber-400" />
            Hotspot Analysis Panel
          </h2>
        </div>

        <div className="p-3 border-b border-slate-200 bg-slate-50 text-xs">
          <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            Filter by Department Category
          </label>
          <select 
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-700 focus:outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Critical Density Zones</h3>
          
          {[
            { name: 'Okhla Industrial Area', count: 142, trend: '+12%', critical: true },
            { name: 'Dwarka Sector 12', count: 98, trend: '+5%', critical: true },
            { name: 'Seelampur Ward 9', count: 87, trend: '-3%', critical: true },
            { name: 'Karol Bagh Ward 15', count: 76, trend: '+2%', critical: false },
            { name: 'Jama Masjid Ward 8', count: 65, trend: '-8%', critical: false },
            { name: 'Chandni Chowk', count: 54, trend: '+1%', critical: false },
            { name: 'Connaught Place', count: 43, trend: '-15%', critical: false },
          ].map((area, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-semibold text-slate-900 flex items-center gap-1">
                  <MapPin className={`h-3 w-3 ${area.critical ? 'text-red-600' : 'text-blue-700'}`} />
                  {area.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {area.count} registered complaints
                </p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                area.trend.startsWith('+') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {area.trend}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
