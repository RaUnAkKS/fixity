'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HotspotPoint } from '@/lib/types';

// Fix Leaflet default icon issue with webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markerPosition?: [number, number] | null;
  hotspots?: HotspotPoint[];
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

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenter = useRef(center);
  
  useEffect(() => {
    if (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1]) {
      map.setView(center, map.getZoom());
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
}

export default function MapView({
  center,
  zoom = 13,
  markerPosition,
  hotspots,
  onLocationSelect,
  height = '400px',
  interactive = true,
}: MapViewProps) {
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      {interactive && <MapClickHandler onLocationSelect={onLocationSelect} />}
      {markerPosition && (
        <Marker
          position={markerPosition}
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
      {hotspots?.map((hotspot, idx) => (
        <Circle
          key={idx}
          center={[hotspot.lat, hotspot.lng]}
          radius={300 * hotspot.weight}
          pathOptions={{
            color: hotspot.weight > 0.7 ? '#EF4444' : hotspot.weight > 0.4 ? '#F97316' : '#EAB308',
            fillColor: hotspot.weight > 0.7 ? '#EF4444' : hotspot.weight > 0.4 ? '#F97316' : '#EAB308',
            fillOpacity: 0.5,
          }}
        >
          <Popup>
            <div>
              <strong>Hotspot Intensity:</strong> {Math.round(hotspot.weight * 100)}%
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
