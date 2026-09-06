'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { HotspotPoint } from '@/lib/types';

// Standalone SVG Marker Pin (No CDN/unpkg reliance)
export const createPinIcon = (color = '#2563eb') => {
  return L.divIcon({
    className: 'fixity-pin-icon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.25;"></div>
        <div style="position: relative; width: 28px; height: 28px; background: ${color}; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
};

export interface IncidentMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  category?: string;
  severity?: number;
  address?: string;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markerPosition?: [number, number] | null;
  hotspots?: HotspotPoint[];
  incidents?: IncidentMarker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  interactive?: boolean;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

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
  const prevCenter = useRef(center);
  
  useEffect(() => {
    if (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1]) {
      map.setView(center, map.getZoom());
      prevCenter.current = center;
      map.invalidateSize();
    }
  }, [center, map]);

  return null;
}

export default function MapView({
  center,
  zoom = 13,
  markerPosition,
  hotspots,
  incidents,
  onLocationSelect,
  height = '400px',
  interactive = true,
}: MapViewProps) {
  const defaultPin = createPinIcon('#2563eb');

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
      className="z-0"
      scrollWheelZoom={interactive}
      dragging={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizer />
      <RecenterMap center={center} />
      {interactive && <MapClickHandler onLocationSelect={onLocationSelect} />}
      
      {/* Selected Marker Position */}
      {markerPosition && (
        <Marker
          position={markerPosition}
          icon={defaultPin}
          draggable={interactive}
          eventHandlers={
            interactive && onLocationSelect
              ? {
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onLocationSelect(position.lat, position.lng);
                  },
                }
              : {}
          }
        />
      )}

      {/* Incident Markers with Popups */}
      {incidents?.map((inc) => {
        const pinColor = (inc.severity ?? 50) >= 70 ? '#e11d48' : (inc.severity ?? 50) >= 40 ? '#d97706' : '#2563eb';
        const incIcon = createPinIcon(pinColor);
        return (
          <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incIcon}>
            <Popup>
              <div className="p-1 max-w-[220px] text-left">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-blue-700">
                    #{inc.id.slice(0, 8).toUpperCase()}
                  </span>
                  {inc.severity && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      inc.severity >= 70 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Sev {inc.severity}
                    </span>
                  )}
                </div>
                {inc.category && (
                  <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{inc.category}</p>
                )}
                <p className="text-[11px] text-slate-600 line-clamp-2">{inc.address || inc.title || 'Civic Incident'}</p>
                <div className="mt-2 pt-1 border-t border-slate-200">
                  <a
                    href={`/complaints/${inc.id}`}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    View Report &rarr;
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Hotspots Intensity Circles */}
      {hotspots?.map((hotspot, idx) => (
        <Circle
          key={idx}
          center={[hotspot.lat, hotspot.lng]}
          radius={300 * hotspot.weight}
          pathOptions={{
            color: hotspot.weight > 0.7 ? '#EF4444' : hotspot.weight > 0.4 ? '#F97316' : '#EAB308',
            fillColor: hotspot.weight > 0.7 ? '#EF4444' : hotspot.weight > 0.4 ? '#F97316' : '#EAB308',
            fillOpacity: 0.45,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs">
              <strong>Hotspot Intensity:</strong> {Math.round(hotspot.weight * 100)}%
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
