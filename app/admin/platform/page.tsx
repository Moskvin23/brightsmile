'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import Select, { type Opt } from '@/components/Select';
import Modal from '@/components/Modal';
import { CITIES, CityKey, clinics as seed, DEPOSIT, type Clinic } from '@/lib/data';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="map map-loading" /> });

type Col = 'name' | 'city' | 'rating' | 'bookings30d' | 'revenue' | 'plan' | 'status' | 'createdDaysAgo';
const PAGE = 12;
const CITY_OPTS: Opt[] = [{ value: '', label: 'All cities' }, ...(Object.keys(CITIES) as CityKey[]).map((k) => ({ value: k, label: CITIES[k].name }))];
const STATUS_OPTS: Opt[] = [{ value: '', label: 'All statuses' }, ...['Active', 'Pending review', 'Suspended'].map((v) => ({ value: v, label: v }))];
const PLAN_OPTS: Opt[] = [{ value: '', label: 'All plans' }, ...['Starter', 'Growth', 'Pro', 'Trial'].map((v) => ({ value: v, label: v }))];
const RATING_OPTS: Opt[] = [
  { value: '0', label: 'Any rating' },
  { value: '4.5', label: '4.5+' },
  { value: '4.8', label: '4.8+' },
];
const CREATED_OPTS: Opt[] = [
  { value: '', label: 'Created: any time' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'old', label: 'Older than 90 days' },
];
const ROW_MENU: Opt[] = [
  { value: 'activate', label: 'Approve / activate' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'open', label: 'Open clinic page' },
];
const PATIENTS = ['Megan T.', 'Carlos R.', 'Jessica L.', 'Brian K.', 'Ana P.', 'Tyler S.', 'Nina W.', 'Marcus D.', 'Sofia M.', 'Ryan B.'];
const NO_SHOW = 6.2; // demo figure

const money = (n: number) => `$${n.toLocaleString('en-US')}`;
const isNew = (c: Clinic) => c.id.startsWith('new-');

export default function PlatformAdmin() {
  const [tab, setTab] = useState('clinics');
  const [rows, setRows] = useState<Clinic[]>(seed);
  const [q, setQ] = useState('');
  const [city, setCity] = useState<CityKey | ''>('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [created, setCreated] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 }>({ col: 'bookings30d', dir: -1 });
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'table' | 'map'>('table');
  const [mapSel, setMapSel] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [userQ, setUserQ] = useState('');

  useEffect(() => {
    if (tab === 'moderation') {
      setStatus('Pending review');
      setTab('clinics');
    }
  }, [tab]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const val = (c: Clinic, k: Col) => (k === 'revenue' ? c.bookings30d * DEPOSIT : (c as unknown as Record<string, string | number>)[k]);
    return rows
      .filter(
        (c) =>
          (!q || `${c.name} ${c.address}`.toLowerCase().includes(q.toLowerCase())) &&
          (!city || c.city === city) &&
          (!status || c.status === status) &&
          (!plan || c.plan === plan) &&
          c.rating >= minRating &&
          (!created || (created === 'old' ? c.createdDaysAgo > 90 : c.createdDaysAgo <= Number(created))),
      )
      .sort((a, b) => {
        const x = val(a, sort.col),
          y = val(b, sort.col);
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
      });
  }, [rows, q, city, status, plan, created, minRating, sort]);

  useEffect(() => setPage(1), [q, city, status, plan, created, minRating]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);

  const active = rows.filter((c) => c.status === 'Active');
  const bookings = active.reduce((s, c) => s + c.bookings30d, 0);
  const pendingN = rows.filter((c) => c.status === 'Pending review').length;

  const head = (col: Col, label: string) => (
    <button
      className={`th${sort.col === col ? ' on' : ''}`}
      onClick={() => setSort({ col, dir: sort.col === col ? (sort.dir === 1 ? -1 : 1) : col === 'name' || col === 'city' ? 1 : -1 })}
    >
      {label} {sort.col === col ? (sort.dir === 1 ? '↑' : '↓') : '↕'}
    </button>
  );
  const setStatusOf = (ids: Set<string>, s: Clinic['status']) => setRows(rows.map((c) => (ids.has(c.id) ? { ...c, status: s } : c)));
  const bulk = (s: Clinic['status']) => {
    setStatusOf(sel, s);
    setToast(`${sel.size} clinic${sel.size > 1 ? 's' : ''} updated`);
    setSel(new Set());
  };
  const toggle = (id: string) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };
  const rowAction = (c: Clinic, a: string) => {
    if (a === 'open') {
      if (isNew(c)) setToast('New clinics have no public page in this demo');
      else window.location.href = `/clinic/${c.id}/`;
      return;
    }
    setStatusOf(new Set([c.id]), a === 'activate' ? 'Active' : 'Suspended');
    setToast(`${c.name}: ${a === 'activate' ? 'active' : 'suspended'}`);
  };
  const exportCsv = () => {
    const lines = [['id', 'name', 'city', 'rating', 'bookings_30d', 'revenue_30d', 'plan', 'status'].join(',')].concat(
      filtered.map((c) =>
        [c.id, `"${c.name}"`, CITIES[c.city].name.replace(',', ''), c.rating, c.bookings30d, c.bookings30d * DEPOSIT, c.plan, c.status].join(','),
      ),
    );
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinics.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const addClinic = (name: string, cityKey: CityKey, planName: Clinic['plan']) => {
    const base = seed.find((c) => c.city === cityKey && c.status === 'Active')!;
    const n = rows.filter(isNew).length + 1;
    const [lng, lat] = CITIES[cityKey].center;
    const fresh: Clinic = {
      ...base,
      id: `new-${n}`,
      name,
      city: cityKey,
      plan: planName,
      status: 'Pending review',
      rating: 0,
      reviewCount: 0,
      reviews: [],
      bookings30d: 0,
      createdDaysAgo: 0,
      lng: lng + (Math.random() - 0.5) * 0.08,
      lat: lat + (Math.random() - 0.5) * 0.06,
    };
    setRows([fresh, ...rows]);
    setAdding(false);
    setSort({ col: 'createdDaysAgo', dir: 1 });
    setTab('clinics');
    setView('table');
    setToast(`${name} added — pending review`);
  };
  const hasFilters = q || city || status || plan || created || minRating;

  const items = [
    { key: 'overview', label: 'Overview', icon: '◔' },
    { key: 'clinics', label: 'Clinics', icon: '⌂' },
    { key: 'moderation', label: 'Moderation', icon: '⚑', badge: String(pendingN) },
    { key: 'bookings', label: 'Bookings', icon: '▦' },
    { key: 'payments', label: 'Payments', icon: '$' },
    { key: 'reviews', label: 'Reviews', icon: '★' },
    { key: 'users', label: 'Users', icon: '☺' },
    { key: 'settings', label: 'Settings', icon: '⚙' },
  ];

  const mapData = filtered
    .filter((c) => !city || c.city === city)
    .map((c) => ({ ...c, fromPrice: Math.min(...c.services.map((s) => s.price).filter(Boolean)), nextLabel: `${c.bookings30d} bookings / 30d` }));
  const kpis = (
    <div className="kpis">
      <div className="kpi">
        <span>Active clinics</span>
        <b>{active.length}</b>
        <em className="up">+8 this month</em>
      </div>
      <div className="kpi">
        <span>Bookings (30 days)</span>
        <b>{bookings.toLocaleString('en-US')}</b>
        <em className="up">+12.4%</em>
      </div>
      <div className="kpi">
        <span>Booking revenue</span>
        <b>{money(bookings * DEPOSIT)}</b>
        <em className="up">+9.1%</em>
      </div>
      <div className="kpi">
        <span>No-show rate</span>
        <b>{NO_SHOW}%</b>
        <em className="up">−1.3 pts</em>
      </div>
    </div>
  );

  return (
    <AdminShell sub="Platform admin" items={items} active={tab} onNav={setTab} switchTo={{ href: '/admin/', label: 'Switch to clinic admin →' }}>
      <div className="admin-pad">
        {tab === 'clinics' && (
          <>
            <div className="admin-top">
              <h1>Clinics</h1>
              <div className="row-gap">
                <button className="btn ghost" onClick={exportCsv}>
                  ⇩ Export CSV
                </button>
                <button className="btn" onClick={() => setAdding(true)}>
                  + Add clinic
                </button>
              </div>
            </div>
            {kpis}
            <div className="toolbar">
              <input className="search-in" placeholder="⌕  Search clinic or address…" value={q} onChange={(e) => setQ(e.target.value)} />
              <Select
                variant="chip"
                ariaLabel="City"
                value={city}
                onChange={(v) => {
                  setCity(v as CityKey | '');
                  setMapSel(null);
                }}
                options={CITY_OPTS}
                active={!!city}
              />
              <Select variant="chip" ariaLabel="Status" value={status} onChange={setStatus} options={STATUS_OPTS} active={!!status} />
              <Select
                variant="chip"
                ariaLabel="Rating"
                value={String(minRating)}
                onChange={(v) => setMinRating(Number(v))}
                options={RATING_OPTS}
                active={!!minRating}
              />
              <Select variant="chip" ariaLabel="Plan" value={plan} onChange={setPlan} options={PLAN_OPTS} active={!!plan} />
              <Select variant="chip" ariaLabel="Created" value={created} onChange={setCreated} options={CREATED_OPTS} active={!!created} />
              {hasFilters ? (
                <button
                  className="link"
                  onClick={() => {
                    setQ('');
                    setCity('');
                    setStatus('');
                    setPlan('');
                    setCreated('');
                    setMinRating(0);
                  }}
                >
                  Clear
                </button>
              ) : null}
              <div className="grow" />
              <div className="seg">
                <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}>
                  ☰ Table
                </button>
                <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
                  ◎ Map
                </button>
              </div>
            </div>

            {sel.size > 0 && (
              <div className="bulkbar">
                {sel.size} selected
                <button onClick={() => bulk('Active')}>Approve / activate</button>
                <button onClick={() => bulk('Suspended')}>Suspend</button>
                <button className="link" onClick={() => setSel(new Set())}>
                  Cancel
                </button>
              </div>
            )}

            {view === 'table' ? (
              <div className="dtable">
                <div className="dt-row dt-head c-cols">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={shown.length > 0 && shown.every((c) => sel.has(c.id))}
                    onChange={(e) => {
                      const n = new Set(sel);
                      shown.forEach((c) => (e.target.checked ? n.add(c.id) : n.delete(c.id)));
                      setSel(n);
                    }}
                  />
                  {head('name', 'Clinic')}
                  {head('city', 'City')}
                  {head('rating', 'Rating')}
                  {head('bookings30d', 'Bookings')}
                  {head('revenue', 'Revenue')}
                  {head('plan', 'Plan')}
                  {head('status', 'Status')}
                  {head('createdDaysAgo', 'Joined')}
                  <span />
                </div>
                {shown.map((c) => (
                  <div key={c.id} className={`dt-row c-cols${sel.has(c.id) ? ' selected' : ''}`}>
                    <input type="checkbox" aria-label={`Select ${c.name}`} checked={sel.has(c.id)} onChange={() => toggle(c.id)} />
                    {isNew(c) ? (
                      <span className="strong">{c.name}</span>
                    ) : (
                      <Link href={`/clinic/${c.id}/`} className="strong">
                        {c.name}
                      </Link>
                    )}
                    <span>{CITIES[c.city].name}</span>
                    <span>{c.reviewCount ? `★ ${c.rating.toFixed(1)}` : '—'}</span>
                    <span>{c.bookings30d}</span>
                    <span>{money(c.bookings30d * DEPOSIT)}</span>
                    <span>{c.plan}</span>
                    <span>
                      <em className={`badge ${c.status === 'Active' ? 's-arrived' : c.status === 'Suspended' ? 's-noshow' : 's-pending'}`}>{c.status}</em>
                    </span>
                    <span>
                      {c.createdDaysAgo === 0 ? 'today' : c.createdDaysAgo < 30 ? `${c.createdDaysAgo}d ago` : `${Math.round(c.createdDaysAgo / 30)} mo ago`}
                    </span>
                    <Select
                      variant="bare"
                      className="sel-dots"
                      ariaLabel={`Actions for ${c.name}`}
                      value=""
                      onChange={(a) => rowAction(c, a)}
                      options={ROW_MENU}
                      display="⋯"
                    />
                  </div>
                ))}
                {!shown.length && (
                  <div className="empty">
                    <b>No clinics match.</b>
                  </div>
                )}
                <div className="dt-foot">
                  <span>
                    {sel.size ? `${sel.size} selected · ` : ''}Showing {filtered.length ? (page - 1) * PAGE + 1 : 0}–{Math.min(page * PAGE, filtered.length)} of{' '}
                    {filtered.length} clinics
                  </span>
                  <div className="pager">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                      ‹
                    </button>
                    <span>
                      Page {page} of {pages}
                    </span>
                    <button disabled={page === pages} onClick={() => setPage(page + 1)}>
                      ›
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-map">
                <MapView
                  clinics={mapData}
                  center={CITIES[city || 'austin'].center}
                  hoveredId={null}
                  selectedId={mapSel}
                  onSelect={setMapSel}
                  onHover={() => {}}
                  onMoved={() => {}}
                />
                {!city && <div className="map-hint">Showing Austin — pick a city to jump</div>}
              </div>
            )}
          </>
        )}

        {tab === 'overview' && (
          <>
            <h1>Overview</h1>
            {kpis}
            <div className="panels">
              <div className="panel">
                <h3>Bookings by city (30 days)</h3>
                {(Object.keys(CITIES) as CityKey[]).map((k) => {
                  const n = active.filter((c) => c.city === k).reduce((s, c) => s + c.bookings30d, 0);
                  const m = Math.max(
                    ...(Object.keys(CITIES) as CityKey[]).map((x) => active.filter((c) => c.city === x).reduce((s, c) => s + c.bookings30d, 0)),
                    1,
                  );
                  return (
                    <div key={k} className="hbar">
                      <span>{CITIES[k].name}</span>
                      <div>
                        <i style={{ width: `${(n / m) * 100}%` }} />
                      </div>
                      <b>{n.toLocaleString('en-US')}</b>
                    </div>
                  );
                })}
              </div>
              <div className="panel">
                <h3>Top clinics</h3>
                {[...active]
                  .sort((a, b) => b.bookings30d - a.bookings30d)
                  .slice(0, 5)
                  .map((c) => (
                    <div key={c.id} className="sum-row" style={{ marginBottom: 10 }}>
                      <Link href={`/clinic/${c.id}/`} className="strong">
                        {c.name}
                      </Link>
                      <b>{c.bookings30d}</b>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {tab === 'bookings' && (
          <>
            <h1>Bookings</h1>
            <div className="dtable">
              <div className="dt-row dt-head" style={{ gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1fr' }}>
                <span>Clinic</span>
                <span>Service</span>
                <span>Patient</span>
                <span>When</span>
                <span>Status</span>
              </div>
              {[...active]
                .sort((a, b) => b.bookings30d - a.bookings30d)
                .slice(0, 15)
                .map((c, i) => (
                  <div key={c.id} className="dt-row" style={{ gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1fr' }}>
                    <b>{c.name}</b>
                    <span>{c.services[i % c.services.length].name}</span>
                    <span>{PATIENTS[i % PATIENTS.length]}</span>
                    <span>{i < 4 ? `${i + 1}h ago` : `${Math.floor(i / 3)}d ago`}</span>
                    <span>
                      <em className={`badge ${i % 7 === 6 ? 's-noshow' : i % 3 === 0 ? 's-confirmed' : 's-arrived'}`}>
                        {i % 7 === 6 ? 'No-show' : i % 3 === 0 ? 'Upcoming' : 'Completed'}
                      </em>
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === 'payments' && (
          <>
            <h1>Payments</h1>
            <div className="dtable">
              <div className="dt-row dt-head" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr' }}>
                <span>Plan</span>
                <span>Clinics</span>
                <span>Bookings</span>
                <span>Deposits</span>
              </div>
              {(['Pro', 'Growth', 'Starter', 'Trial'] as const).map((p) => {
                const cs = active.filter((c) => c.plan === p);
                const b = cs.reduce((s, c) => s + c.bookings30d, 0);
                return (
                  <div key={p} className="dt-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr' }}>
                    <b>{p}</b>
                    <span>{cs.length}</span>
                    <span>{b.toLocaleString('en-US')}</span>
                    <span>{money(b * DEPOSIT)}</span>
                  </div>
                );
              })}
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              Deposits are ${DEPOSIT} per booking (demo mode — no real charges).
            </p>
          </>
        )}

        {tab === 'reviews' && (
          <>
            <h1>Reviews</h1>
            <div className="stack">
              {rows
                .filter((c) => c.status === 'Active')
                .slice(0, 14)
                .map((c) => ({ c, r: c.reviews[0] }))
                .filter((x) => x.r)
                .map(({ c, r }) => {
                  const key = c.id;
                  const off = hidden.has(key);
                  return (
                    <div key={key} className="review" style={{ opacity: off ? 0.5 : 1 }}>
                      <b>
                        {'★'.repeat(r.rating)} {r.author} · {c.name} · {r.ago}
                      </b>
                      <p>{r.text}</p>
                      <button
                        className="link"
                        onClick={() => {
                          const n = new Set(hidden);
                          off ? n.delete(key) : n.add(key);
                          setHidden(n);
                        }}
                      >
                        {off ? 'Restore' : 'Hide review'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {tab === 'users' && (
          <>
            <div className="admin-top">
              <h1>Users</h1>
              <input className="search-in" placeholder="Search name or email…" value={userQ} onChange={(e) => setUserQ(e.target.value)} />
            </div>
            <div className="dtable">
              <div className="dt-row dt-head" style={{ gridTemplateColumns: '1.4fr 1.8fr 1.6fr 1fr' }}>
                <span>Name</span>
                <span>Email</span>
                <span>Clinic</span>
                <span>Role</span>
              </div>
              {rows
                .filter((c) => !isNew(c))
                .slice(0, 40)
                .map((c) => ({ c, n: c.dentists[0].name.replace('Dr. ', '') }))
                .filter(({ c, n }) => `${n} ${c.name}`.toLowerCase().includes(userQ.toLowerCase()))
                .slice(0, 15)
                .map(({ c, n }) => (
                  <div key={c.id} className="dt-row" style={{ gridTemplateColumns: '1.4fr 1.8fr 1.6fr 1fr' }}>
                    <b>{n}</b>
                    <span>
                      {n.toLowerCase().replace(/[^a-z]+/g, '.')}@{c.name.toLowerCase().replace(/[^a-z]+/g, '')}.example
                    </span>
                    <span>{c.name}</span>
                    <span>Owner</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === 'settings' && (
          <>
            <h1>Settings</h1>
            <div className="stack">
              <label className="field">
                <span>Booking deposit (USD)</span>
                <input defaultValue={DEPOSIT} readOnly />
              </label>
              <label className="field">
                <span>Free cancellation window</span>
                <input defaultValue="24 hours" readOnly />
              </label>
              <label className="field">
                <span>Cities</span>
                <input defaultValue={(Object.keys(CITIES) as CityKey[]).map((k) => CITIES[k].name).join(' · ')} readOnly />
              </label>
              <p className="muted" style={{ fontSize: 13 }}>
                Demo: platform settings are read-only.
              </p>
            </div>
          </>
        )}
      </div>
      {adding && <AddClinic onClose={() => setAdding(false)} onAdd={addClinic} names={rows.map((c) => c.name.toLowerCase())} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </AdminShell>
  );
}

function AddClinic({ onClose, onAdd, names }: { onClose: () => void; onAdd: (n: string, c: CityKey, p: Clinic['plan']) => void; names: string[] }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState<CityKey>('austin');
  const [plan, setPlan] = useState<Clinic['plan']>('Trial');
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setErr('Enter the clinic name');
    if (names.includes(name.trim().toLowerCase())) return setErr('A clinic with this name already exists');
    onAdd(name.trim(), city, plan);
  };
  return (
    <Modal title="Add clinic" onClose={onClose}>
      <form className="modal-form" noValidate onSubmit={submit}>
        <h3>Add clinic</h3>
        <label className="field">
          <span>Clinic name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr('');
            }}
            placeholder="Sunrise Family Dental"
            autoFocus
          />
        </label>
        <div className="field">
          <span>City</span>
          <Select ariaLabel="City" value={city} onChange={(v) => setCity(v as CityKey)} options={CITY_OPTS.slice(1)} />
        </div>
        <div className="field">
          <span>Plan</span>
          <Select ariaLabel="Plan" value={plan} onChange={(v) => setPlan(v as Clinic['plan'])} options={PLAN_OPTS.slice(1)} />
        </div>
        {err && (
          <small className="err" role="alert">
            {err}
          </small>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            Add clinic
          </button>
        </div>
      </form>
    </Modal>
  );
}
