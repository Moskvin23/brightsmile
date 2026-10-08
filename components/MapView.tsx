'use client';
import { useEffect, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource, LngLatBoundsLike, Map as MLMap } from 'maplibre-gl';
import type { Clinic } from '@/lib/data';

type Props = {
  clinics: (Clinic & { fromPrice: number; nextLabel: string; distance?: number })[];
  center: [number, number];
  hoveredId: string | null;
  selectedId: string | null;
  /** bump `n` to fly the map to a clinic (e.g. when its card is clicked in the list) */
  focus?: { id: string; n: number } | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onMoved: (b: [number, number, number, number]) => void;
};

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const CITY_ZOOM = 11.2;
// must be above the source's clusterMaxZoom, otherwise the clinic is still hidden inside a cluster
const FOCUS_ZOOM = 14.5;

type Marker = { m: maplibregl.Marker; el: HTMLDivElement };

export default function MapView({ clinics, center, hoveredId, selectedId, focus, onSelect, onHover, onMoved }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const popup = useRef<maplibregl.Popup | null>(null);
  const [failed, setFailed] = useState(false);
  const data = useRef(clinics);
  const hl = useRef({ hoveredId, selectedId });
  const cb = useRef({ onSelect, onHover, onMoved });
  cb.current = { onSelect, onHover, onMoved };
  data.current = clinics;
  hl.current = { hoveredId, selectedId };

  // init once
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({ container: box.current, style: STYLE, center, zoom: CITY_ZOOM, attributionControl: { compact: true } });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const pins = markers.current;
    let timer: number | undefined;
    // Pins are HTML elements that mirror the un-clustered features. Syncing is throttled instead of
    // running on every rendered frame.
    const schedule = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (map.current) syncMarkers();
      }, 80);
    };

    m.on('load', () => {
      m.addSource('clinics', { type: 'geojson', data: toGeo(data.current), cluster: true, clusterMaxZoom: 13, clusterRadius: 60 });
      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'clinics',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0D9488',
          'circle-radius': ['step', ['get', 'point_count'], 18, 6, 22, 12, 27],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });
      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'clinics',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] },
        paint: { 'text-color': '#fff' },
      });
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
    m.on('error', (e) => {
      if (!m.loaded() && !(e as { sourceId?: string }).sourceId?.startsWith('clinics')) setFailed(true);
    });
    m.on('load', () => setFailed(false));
    m.on('sourcedata', (e) => {
      if (e.sourceId === 'clinics' && e.isSourceLoaded) schedule();
    });
    m.on('move', schedule);
    m.on('moveend', (e) => {
      schedule();
      if (!(e as { originalEvent?: unknown }).originalEvent) return; // only user moves
      const b = m.getBounds();
      cb.current.onMoved([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    });
    m.on('click', (e) => {
      if (!m.queryRenderedFeatures(e.point, { layers: ['clusters'] }).length && !(e.originalEvent.target as HTMLElement).closest('.pin'))
        cb.current.onSelect(null);
    });

    function syncMarkers() {
      if (!m.getSource('clinics') || !m.isSourceLoaded('clinics')) return;
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
          el.innerHTML = `★ ${c.rating.toFixed(1)} <b>$${Number(c.fromPrice)}</b>`;
          el.onmouseenter = () => cb.current.onHover(c.id);
          el.onmouseleave = () => cb.current.onHover(null);
          el.onclick = (ev) => {
            ev.stopPropagation();
            cb.current.onSelect(c.id);
          };
          const mk = new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(m);
          markers.current.set(p.id, { m: mk, el });
        }
      }
      for (const [id, v] of markers.current)
        if (!seen.has(id)) {
          v.m.remove();
          markers.current.delete(id);
        }
      paint(markers.current, hl.current);
    }

    // the map lives in a container that can be hidden (mobile list view) or resized
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(box.current);

    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      popup.current?.remove();
      m.remove();
      map.current = null;
      pins.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // data changes -> update source, drop stale markers (they are re-created by the next sync)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const src = m.getSource('clinics') as GeoJSONSource | undefined;
    if (!src) return;
    for (const v of markers.current.values()) v.m.remove();
    markers.current.clear();
    src.setData(toGeo(clinics));
  }, [clinics]);

  // city change
  useEffect(() => {
    map.current?.flyTo({ center, zoom: CITY_ZOOM, duration: 900 });
  }, [center]);

  // highlight hovered / selected pin
  useEffect(() => {
    paint(markers.current, { hoveredId, selectedId });
  }, [hoveredId, selectedId]);

  // popup for selected clinic
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    popup.current?.remove();
    const c = clinics.find((x) => x.id === selectedId);
    if (!c) return;
    const dist = c.distance != null ? ` · ${c.distance.toFixed(1)} mi` : '';
    const html = `<a class="pop" href="/clinic/${esc(c.id)}/"><i style="background:linear-gradient(135deg,${esc(c.photo)},#f1f5f9)"></i><div><b>${esc(c.name)}</b><span>★ ${c.rating.toFixed(1)} (${c.reviewCount})${dist} · from $${c.fromPrice}</span><em>Next: ${esc(c.nextLabel)}</em></div></a>`;
    popup.current = new maplibregl.Popup({ offset: 22, closeButton: false, maxWidth: '300px' }).setLngLat([c.lng, c.lat]).setHTML(html).addTo(m);
    // selected by clicking a pin: just make sure it is on screen (list clicks use `focus` below)
    if (!m.getBounds().contains([c.lng, c.lat])) m.easeTo({ center: [c.lng, c.lat] });
  }, [selectedId, clinics]);

  // zoom to a clinic picked from the list
  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    const c = data.current.find((x) => x.id === focus.id);
    if (!c) return;
    // offset the target a little downwards so the popup that opens above the pin stays in view
    m.flyTo({ center: [c.lng, c.lat], zoom: Math.max(m.getZoom(), FOCUS_ZOOM), offset: [0, 70], duration: 800, essential: true });
  }, [focus]);

  return (
    <>
      <div ref={box} className="map" />
      {failed && (
        <div className="map-error" role="status">
          Map tiles couldn’t be loaded — you can still use the list.
        </div>
      )}
    </>
  );
}

// clinic names can be typed in the platform admin, so never put them into HTML unescaped
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

function paint(all: Map<string, Marker>, s: { hoveredId: string | null; selectedId: string | null }) {
  for (const [id, v] of all) {
    v.el.classList.toggle('hover', id === s.hoveredId);
    v.el.classList.toggle('active', id === s.selectedId);
    v.el.style.zIndex = id === s.selectedId ? '3' : id === s.hoveredId ? '2' : '1';
  }
}

function toGeo(cs: Props['clinics']): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cs.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] }, properties: { id: c.id } })),
  };
}

export type Bounds = LngLatBoundsLike;
