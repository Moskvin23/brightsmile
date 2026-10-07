'use client';
import { useEffect, useRef } from 'react';
import maplibregl, { GeoJSONSource, LngLatBoundsLike, Map as MLMap } from 'maplibre-gl';
import type { Clinic } from '@/lib/data';

type Props = {
  clinics: (Clinic & { fromPrice: number; nextLabel: string })[];
  center: [number, number];
  hoveredId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onMoved: (b: [number, number, number, number]) => void;
};

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

export default function MapView({ clinics, center, hoveredId, selectedId, onSelect, onHover, onMoved }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, { m: maplibregl.Marker; el: HTMLDivElement }>());
  const popup = useRef<maplibregl.Popup | null>(null);
  const data = useRef(clinics);
  const cb = useRef({ onSelect, onHover, onMoved });
  cb.current = { onSelect, onHover, onMoved };
  data.current = clinics;

  // init once
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({ container: box.current, style: STYLE, center, zoom: 11.2, attributionControl: { compact: true } });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    m.on('load', () => {
      m.addSource('clinics', { type: 'geojson', data: toGeo(data.current), cluster: true, clusterMaxZoom: 13, clusterRadius: 60 });
      m.addLayer({ id: 'clusters', type: 'circle', source: 'clinics', filter: ['has', 'point_count'],
        paint: { 'circle-color': '#0D9488', 'circle-radius': ['step', ['get', 'point_count'], 18, 6, 22, 12, 27], 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
      m.addLayer({ id: 'cluster-count', type: 'symbol', source: 'clinics', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] }, paint: { 'text-color': '#fff' } });
      m.on('click', 'clusters', async (e) => {
        const f = m.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        const src = m.getSource('clinics') as GeoJSONSource;
        const zoom = await src.getClusterExpansionZoom(f.properties!.cluster_id);
        m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });
      m.on('mouseenter', 'clusters', () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', 'clusters', () => (m.getCanvas().style.cursor = ''));
      syncMarkers();
    });
    m.on('render', () => { if (m.getSource('clinics') && m.isSourceLoaded('clinics')) syncMarkers(); });
    m.on('moveend', (e) => {
      if (!(e as { originalEvent?: unknown }).originalEvent) return; // only user moves
      const b = m.getBounds();
      cb.current.onMoved([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    });
    m.on('click', (e) => { if (!m.queryRenderedFeatures(e.point, { layers: ['clusters'] }).length && !(e.originalEvent.target as HTMLElement).closest('.pin')) cb.current.onSelect(null); });

    function syncMarkers() {
      const seen = new Set<string>();
      for (const f of m.querySourceFeatures('clinics')) {
        const p = f.properties as { id?: string; cluster?: boolean };
        if (p.cluster || !p.id || seen.has(p.id)) continue;
        seen.add(p.id);
        if (!markers.current.has(p.id)) {
          const c = data.current.find((x) => x.id === p.id);
          if (!c) continue;
          const el = document.createElement('div');
          el.className = 'pin';
          el.innerHTML = `★ ${c.rating.toFixed(1)} <b>$${c.fromPrice}</b>`;
          el.onmouseenter = () => cb.current.onHover(c.id);
          el.onmouseleave = () => cb.current.onHover(null);
          el.onclick = (ev) => { ev.stopPropagation(); cb.current.onSelect(c.id); };
          const mk = new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(m);
          markers.current.set(p.id, { m: mk, el });
        }
      }
      for (const [id, v] of markers.current) if (!seen.has(id)) { v.m.remove(); markers.current.delete(id); }
    }
    return () => { m.remove(); map.current = null; markers.current.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // data changes -> update source, drop stale markers
  useEffect(() => {
    const m = map.current; if (!m) return;
    const src = m.getSource('clinics') as GeoJSONSource | undefined;
    if (!src) return;
    for (const v of markers.current.values()) v.m.remove();
    markers.current.clear();
    src.setData(toGeo(clinics));
  }, [clinics]);

  // city change
  useEffect(() => { map.current?.flyTo({ center, zoom: 11.2, duration: 900 }); }, [center]);

  // highlight
  useEffect(() => {
    for (const [id, v] of markers.current) {
      v.el.classList.toggle('hover', id === hoveredId);
      v.el.classList.toggle('active', id === selectedId);
      v.el.style.zIndex = id === selectedId ? '3' : id === hoveredId ? '2' : '1';
    }
  });

  // popup for selected clinic
  useEffect(() => {
    const m = map.current; if (!m) return;
    popup.current?.remove();
    const c = clinics.find((x) => x.id === selectedId);
    if (!c) return;
    const html = `<a class="pop" href="/clinic/${c.id}/"><i style="background:linear-gradient(135deg,${c.photo},#f1f5f9)"></i><div><b>${c.name}</b><span>★ ${c.rating.toFixed(1)} (${c.reviewCount}) · from $${c.fromPrice}</span><em>Next: ${c.nextLabel}</em></div></a>`;
    popup.current = new maplibregl.Popup({ offset: 22, closeButton: false, maxWidth: '300px' }).setLngLat([c.lng, c.lat]).setHTML(html).addTo(m);
    const b = m.getBounds();
    if (!b.contains([c.lng, c.lat])) m.easeTo({ center: [c.lng, c.lat] });
  }, [selectedId, clinics]);

  return <div ref={box} className="map" />;
}

function toGeo(cs: Props['clinics']): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: cs.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] }, properties: { id: c.id } })) };
}

export type Bounds = LngLatBoundsLike;
