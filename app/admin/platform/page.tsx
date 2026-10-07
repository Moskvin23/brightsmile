'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { CITIES, CityKey, clinics as seed, DEPOSIT, type Clinic } from '@/lib/data';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="map map-loading" /> });

type Col = 'name' | 'city' | 'rating' | 'bookings30d' | 'revenue' | 'plan' | 'status' | 'createdDaysAgo';
const PAGE = 12;

export default function PlatformAdmin() {
  const [tab, setTab] = useState('clinics');
  const [rows, setRows] = useState<Clinic[]>(seed);
  const [q, setQ] = useState('');
  const [city, setCity] = useState<CityKey | ''>('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 }>({ col: 'bookings30d', dir: -1 });
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'table' | 'map'>('table');
  const [mapSel, setMapSel] = useState<string | null>(null);

  useEffect(() => { if (tab === 'moderation') { setStatus('Pending review'); setTab('clinics'); } }, [tab]);

  const filtered = useMemo(() => {
    const val = (c: Clinic, k: Col) => (k === 'revenue' ? c.bookings30d * DEPOSIT : (c as unknown as Record<string, string | number>)[k]);
    return rows
      .filter((c) => (!q || `${c.name} ${c.address}`.toLowerCase().includes(q.toLowerCase())) && (!city || c.city === city) && (!status || c.status === status) && (!plan || c.plan === plan) && c.rating >= minRating)
      .sort((a, b) => { const x = val(a, sort.col), y = val(b, sort.col); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  }, [rows, q, city, status, plan, minRating, sort]);

  useEffect(() => setPage(1), [q, city, status, plan, minRating]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);

  const active = rows.filter((c) => c.status === 'Active');
  const bookings = active.reduce((s, c) => s + c.bookings30d, 0);
  const pendingN = rows.filter((c) => c.status === 'Pending review').length;

  const head = (col: Col, label: string) => (
    <button className={`th${sort.col === col ? ' on' : ''}`} onClick={() => setSort({ col, dir: sort.col === col ? (sort.dir === 1 ? -1 : 1) : col === 'name' || col === 'city' ? 1 : -1 })}>
      {label} {sort.col === col ? (sort.dir === 1 ? '↑' : '↓') : '↕'}
    </button>
  );
  const bulk = (s: Clinic['status']) => { setRows(rows.map((c) => (sel.has(c.id) ? { ...c, status: s } : c))); setSel(new Set()); };
  const toggle = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const exportCsv = () => {
    const lines = [['id', 'name', 'city', 'rating', 'bookings_30d', 'revenue_30d', 'plan', 'status'].join(',')].concat(
      filtered.map((c) => [c.id, `"${c.name}"`, CITIES[c.city].name.replace(',', ''), c.rating, c.bookings30d, c.bookings30d * DEPOSIT, c.plan, c.status].join(',')));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = 'clinics.csv'; a.click();
  };
  const hasFilters = q || city || status || plan || minRating;

  const items = [
    { key: 'clinics', label: 'Clinics', icon: '⌂' },
    { key: 'moderation', label: 'Moderation', icon: '⚑', badge: String(pendingN) },
  ];

  const mapData = filtered.filter((c) => !city || c.city === city).map((c) => ({ ...c, fromPrice: Math.min(...c.services.map((s) => s.price).filter(Boolean)), nextLabel: `${c.bookings30d} bookings / 30d` }));

  return (
    <AdminShell sub="Platform admin" items={items} active={tab} onNav={setTab} switchTo={{ href: '/admin/', label: 'Switch to clinic admin →' }}>
      <div className="admin-pad">
        <div className="admin-top"><h1>Clinics</h1>
          <div className="row-gap"><button className="btn ghost" onClick={exportCsv}>⇩ Export CSV</button></div>
        </div>
        <div className="kpis">
          <div className="kpi"><span>Active clinics</span><b>{active.length}</b><em className="up">+8 this month</em></div>
          <div className="kpi"><span>Bookings (30 days)</span><b>{bookings.toLocaleString('en-US')}</b><em className="up">+12.4%</em></div>
          <div className="kpi"><span>Deposit volume</span><b>${(bookings * DEPOSIT).toLocaleString('en-US')}</b><em className="up">+9.1%</em></div>
          <div className="kpi"><span>Pending review</span><b>{pendingN}</b><button className="link" onClick={() => setStatus('Pending review')}>Review →</button></div>
        </div>

        <div className="toolbar">
          <input className="search-in" placeholder="⌕  Search clinic or address…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={city} onChange={(e) => { setCity(e.target.value as CityKey | ''); setMapSel(null); }}><option value="">All cities</option>{(Object.keys(CITIES) as CityKey[]).map((k) => <option key={k} value={k}>{CITIES[k].name}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Active</option><option>Pending review</option><option>Suspended</option></select>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}><option value="">All plans</option><option>Starter</option><option>Growth</option><option>Pro</option></select>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}><option value={0}>Any rating</option><option value={4.5}>4.5+</option><option value={4.8}>4.8+</option></select>
          {hasFilters ? <button className="link" onClick={() => { setQ(''); setCity(''); setStatus(''); setPlan(''); setMinRating(0); }}>Clear</button> : null}
          <div className="grow" />
          <div className="seg"><button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}>☰ Table</button><button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>◎ Map</button></div>
        </div>

        {sel.size > 0 && (
          <div className="bulkbar">{sel.size} selected
            <button onClick={() => bulk('Active')}>Approve / activate</button>
            <button onClick={() => bulk('Suspended')}>Suspend</button>
            <button className="link" onClick={() => setSel(new Set())}>Cancel</button>
          </div>
        )}

        {view === 'table' ? (
          <div className="dtable">
            <div className="dt-row dt-head c-cols">
              <input type="checkbox" checked={shown.length > 0 && shown.every((c) => sel.has(c.id))} onChange={(e) => { const n = new Set(sel); shown.forEach((c) => (e.target.checked ? n.add(c.id) : n.delete(c.id))); setSel(n); }} />
              {head('name', 'Clinic')}{head('city', 'City')}{head('rating', 'Rating')}{head('bookings30d', 'Bookings')}{head('revenue', 'Deposits')}{head('plan', 'Plan')}{head('status', 'Status')}{head('createdDaysAgo', 'Joined')}
            </div>
            {shown.map((c) => (
              <div key={c.id} className={`dt-row c-cols${sel.has(c.id) ? ' selected' : ''}`}>
                <input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} />
                <Link href={`/clinic/${c.id}/`} className="strong">{c.name}</Link>
                <span>{CITIES[c.city].name}</span>
                <span>★ {c.rating.toFixed(1)}</span>
                <span>{c.bookings30d}</span>
                <span>${(c.bookings30d * DEPOSIT).toLocaleString('en-US')}</span>
                <span>{c.plan}</span>
                <span><em className={`badge ${c.status === 'Active' ? 's-arrived' : c.status === 'Suspended' ? 's-noshow' : 's-pending'}`}>{c.status}</em></span>
                <span>{c.createdDaysAgo < 30 ? `${c.createdDaysAgo}d ago` : `${Math.round(c.createdDaysAgo / 30)} mo ago`}</span>
              </div>
            ))}
            {!shown.length && <div className="empty"><b>No clinics match.</b></div>}
            <div className="dt-foot">
              <span>{filtered.length} clinics{sel.size ? ` · ${sel.size} selected` : ''}</span>
              <div className="pager">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                <span>Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-map">
            <MapView clinics={mapData} center={CITIES[city || 'austin'].center} hoveredId={null} selectedId={mapSel} onSelect={setMapSel} onHover={() => {}} onMoved={() => {}} />
            {!city && <div className="map-hint">Showing Austin — pick a city to jump</div>}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
