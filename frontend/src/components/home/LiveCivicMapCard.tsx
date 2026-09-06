'use client';

import Link from 'next/link';
import { ArrowRight, Flame, MapPin, AlertCircle, Wrench } from 'lucide-react';

export function LiveCivicMapCard() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
      
      {/* Top Header Bar */}
      <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs sm:text-sm font-black tracking-tight text-white">
            Live Civic Activity
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
          14 Urban Wards Live
        </span>
      </div>

      {/* Stylized Vector Map Canvas */}
      <div className="relative h-64 sm:h-72 w-full bg-slate-50 overflow-hidden select-none">
        
        {/* Subtle Grid Background Pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="civic-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#civic-map-grid)" />
        </svg>

        {/* Stylized Road Network Lines */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arterial Road 1 (Curved East-West) */}
          <path
            d="M -20 120 C 120 110, 220 180, 420 170"
            stroke="#cbd5e1"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M -20 120 C 120 110, 220 180, 420 170"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Arterial Road 2 (Diagonal North-South) */}
          <path
            d="M 170 -20 C 180 90, 200 190, 290 320"
            stroke="#cbd5e1"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 170 -20 C 180 90, 200 190, 290 320"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Secondary Street (Diagonal Cross) */}
          <path
            d="M 30 320 C 110 200, 280 130, 410 70"
            stroke="#e2e8f0"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 30 320 C 110 200, 280 130, 410 70"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Secondary Link Road */}
          <path
            d="M 280 140 C 330 180, 360 230, 390 310"
            stroke="#e2e8f0"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Zone Label Watermark */}
        <div className="absolute top-3.5 left-4 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
          EAST ZONE • WARD 14
        </div>

        {/* MAP PIN 1: Critical (Rose Pin with Pulse) */}
        <div className="absolute top-[42%] left-[30%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer">
          <span className="absolute -inset-2 rounded-full bg-rose-500/20 animate-ping" />
          <div className="relative h-7 w-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* MAP PIN 2: Blue Pin (Water / Infrastructure) */}
        <div className="absolute top-[28%] left-[76%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer">
          <div className="relative h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform">
            <Wrench className="h-3 w-3" />
          </div>
        </div>

        {/* MAP PIN 3: Amber Pin (Pothole / Road Repair) */}
        <div className="absolute top-[60%] left-[58%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer">
          <div className="relative h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform">
            <MapPin className="h-3 w-3" />
          </div>
        </div>

        {/* FLOATING INCIDENT OVERLAY CARD (Matching user screenshot) */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-[11px] font-bold text-blue-700">
              #FX-1024
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
              CRITICAL
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Road &amp; Potholes
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Ward 14 (Sector 4)
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Crew Dispatched
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Card Footer Bar */}
      <div className="bg-white px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-600 text-[11px]">
          Live Triage Queue:{' '}
          <strong className="text-slate-900 font-bold">312 In Progress</strong>
        </span>
        <Link
          href="/complaints?view=nearby"
          className="text-blue-700 hover:text-blue-800 font-bold text-[11px] inline-flex items-center gap-1 group/link"
        >
          <span>View Incident List</span>
          <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
