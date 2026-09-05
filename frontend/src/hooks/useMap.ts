'use client';

import { useEffect, useRef, useState } from 'react';

interface UseMapOptions {
  center?: [number, number];
  zoom?: number;
}

export function useMap(options: UseMapOptions = {}) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const defaultCenter: [number, number] = options.center || [28.6139, 77.209]; // New Delhi
  const defaultZoom = options.zoom || 12;

  useEffect(() => {
    if (mapRef.current) {
      setMapReady(true);
    }
  }, []);

  return {
    mapRef,
    mapReady,
    defaultCenter,
    defaultZoom,
  };
}
