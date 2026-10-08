'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export default function MiniMap({ lng, lat }: { lng: number; lat: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [lng, lat],
      zoom: 14,
      interactive: false,
      attributionControl: { compact: true },
    });
    const el = document.createElement('div');
    el.className = 'pin active';
    el.textContent = '●';
    new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m);
    return () => m.remove();
  }, [lng, lat]);
  return <div ref={box} className="minimap" />;
}
