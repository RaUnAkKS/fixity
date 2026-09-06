'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, ExternalLink, X, MapPin } from 'lucide-react';

interface ComplaintMapCardProps {
  complaintId: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  category?: string | null;
  severity?: number | null;
}

// Custom Rose Pin Icon matching reference screenshot
const createComplaintDetailPin = () => {
  return L.divIcon({
    className: 'fixity-detail-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: #f43f5e; opacity: 0.35;"></div>
        <div style="position: relative; width: 30px; height: 30px; background: #e11d48; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 14px rgba(225,29,72,0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
    map.invalidateSize();
  }, [center, map]);
  return null;
}

export function ComplaintMapCard({
  complaintId,
  latitude,
  longitude,
  address,
  category,
}: ComplaintMapCardProps) {
  const [showPopup, setShowPopup] = useState(true);
  const center: [number, number] = [latitude, longitude];
  const ticketRef = `#FX-${complaintId.slice(0, 4).toUpperCase()}`;
  const displayAddress = address?.trim() || 'Reported Civic Incident Site';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3 p-3 sm:p-4">
      
      {/* Map Container Viewport */}
      <div className="relative h-72 sm:h-80 w-full rounded-xl overflow-hidden border border-slate-200 select-none">
        
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizer />
          <RecenterMap center={center} />

          {/* Impact Zone Radius Circle */}
          <Circle
            center={center}
            radius={140}
            pathOptions={{
              color: '#e11d48',
              fillColor: '#f43f5e',
              fillOpacity: 0.16,
              weight: 2.5,
            }}
          />

          {/* Incident Center Marker */}
          <Marker
            position={center}
            icon={createComplaintDetailPin()}
            eventHandlers={{
              click: () => setShowPopup(true),
            }}
          />
        </MapContainer>

        {/* Anchored Popup Card Matching User Screenshot */}
        {showPopup && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-4 text-left">
              
              {/* Header with ID and Close Button */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-black text-sm text-slate-900 tracking-tight">
                  {ticketRef}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                  title="Dismiss popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Address / Landmark */}
              <p className="text-xs text-slate-700 font-medium leading-snug pt-2">
                {displayAddress}
              </p>

              {/* Coordinates Pill Badge */}
              <div className="mt-2.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/80 font-mono text-[11px] font-semibold tracking-tight">
                  Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                </span>
              </div>

              {/* Downward Caret Indicator pointing to the pin */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-b border-r border-slate-200/90 rotate-45" />
            </div>
          </div>
        )}

      </div>

      {/* Action Buttons Below Map */}
      <div className="space-y-2 pt-1">
        
        {/* Button 1: Focus on Main Ward Heatmap */}
        <Link
          href="/complaints?view=nearby&view_mode=heatmap"
          className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-2xs group"
        >
          <Navigation className="h-4 w-4 text-blue-700 group-hover:scale-110 transition-transform" />
          <span>Focus on Main Ward Heatmap</span>
        </Link>

        {/* Button 2: Open in External Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <ExternalLink className="h-4 w-4 text-slate-600" />
          <span>Open in External Google Maps</span>
        </a>

      </div>

    </div>
  );
}
export default ComplaintMapCard;
