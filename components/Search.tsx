'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CITIES, CityKey, clinics, distanceMi, dayLabel, INSURANCE, LANGUAGES, nextSlots, SERVICES, dayKey } from '@/lib/data';
import Logo from './Logo';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map map-loading" /> });

type Sort = 'nearest' | 'rating' | 'price' | 'soonest' | 'reviews';
const PAGE = 10;

export default function Search() {
  const [now, setNow] = useState<Date | null>(null);
  const [city, setCity] = useState<CityKey>('austin');
  const [service, setService] = useState('cleaning');
  const [insurance, setInsurance] = useState('');
  const [today, setToday] = useState(false);
  const [rating, setRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [lang, setLang] = useState('');
  const [newPatients, setNewPatients] = useState(false);
  const [weekends, setWeekends] = useState(false);
  const [sort, setSort] = useState<Sort>('nearest');
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [pending, setPending] = useState<[number, number, number, number] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const q = new URLSearchParams(window.location.search).get('city') as CityKey | null;
    if (q && q in CITIES) setCity(q);
  }, []);

  const center = CITIES[city].center;

  const enriched = useMemo(() => {
    if (!now) return [];
    return clinics
      .filter((c) => c.city === city && c.status === 'Active')
      .map((c) => {
        const svc = c.services.find((s) => s.id === service);
        const slots = nextSlots(c, now, 3);
        return {
          ...c,
          svc,
          fromPrice: svc ? svc.price : Math.min(...c.services.map((s) => s.price).filter(Boolean)),
          distance: distanceMi(center, [c.lng, c.lat]),
          slots,
          nextLabel: slots[0] ? `${dayLabel(slots[0].day, now)} ${slots[0].time}` : 'No slots this week',
          soonest: slots[0] ? slots[0].day.getTime() + toMin(slots[0].time) * 6e4 : Infinity,
        };
      });
  }, [city, service, now, center]);

  const filtered = useMemo(() => {
    let r = enriched.filter((c) =>
      c.svc &&
      (!insurance || c.insurance.includes(insurance)) &&
      (!today || (now && c.slots[0] && dayKey(c.slots[0].day) === dayKey(now))) &&
      c.rating >= rating &&
      (!maxPrice || c.fromPrice <= maxPrice) &&
      (!lang || c.languages.includes(lang)) &&
      (!newPatients || c.newPatients) &&
      (!weekends || c.weekends) &&
      (!bounds || (c.lng >= bounds[0] && c.lat >= bounds[1] && c.lng <= bounds[2] && c.lat <= bounds[3])),
    );
    const cmp: Record<Sort, (a: (typeof r)[0], b: (typeof r)[0]) => number> = {
      nearest: (a, b) => a.distance - b.distance,
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      price: (a, b) => a.fromPrice - b.fromPrice,
      soonest: (a, b) => a.soonest - b.soonest,
      reviews: (a, b) => b.reviewCount - a.reviewCount,
    };
    r = [...r].sort(cmp[sort]);
    return r;
  }, [enriched, insurance, today, rating, maxPrice, lang, newPatients, weekends, bounds, sort, now]);

  useEffect(() => setPage(1), [filtered.length, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);

  // scroll selected card into view
  useEffect(() => {
    if (!selected) return;
    const i = filtered.findIndex((c) => c.id === selected);
    if (i >= 0 && Math.floor(i / PAGE) + 1 !== page) setPage(Math.floor(i / PAGE) + 1);
    setTimeout(() => document.getElementById('card-' + selected)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const activeCount = [insurance, today, rating, maxPrice, lang, newPatients, weekends].filter(Boolean).length;
  const reset = () => { setInsurance(''); setToday(false); setRating(0); setMaxPrice(0); setLang(''); setNewPatients(false); setWeekends(false); setBounds(null); };
  const switchCity = (c: CityKey) => { setCity(c); setBounds(null); setPending(null); setSelected(null); };

  return (
    <div className="search-page">
      <header className="topbar">
        <Logo />
        <div className="searchbar">
          <label><span>Service</span>
            <select value={service} onChange={(e) => setService(e.target.value)}>{SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </label>
          <label><span>Location</span>
            <select value={city} onChange={(e) => switchCity(e.target.value as CityKey)}>{(Object.keys(CITIES) as CityKey[]).map((k) => <option key={k} value={k}>{CITIES[k].name}</option>)}</select>
          </label>
          <label className="hide-sm"><span>Insurance</span>
            <select value={insurance} onChange={(e) => setInsurance(e.target.value)}><option value="">Any / self-pay</option>{INSURANCE.map((i) => <option key={i}>{i}</option>)}</select>
          </label>
        </div>
        <nav className="top-links">
          <Link href="/admin/">For clinics</Link>
          <Link href="/admin/platform/" className="pill-btn">Admin demo</Link>
        </nav>
      </header>

      <div className="filterbar">
        <button className={`chip${filtersOpen ? ' on' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}>⚙ Filters{activeCount ? ` · ${activeCount}` : ''}</button>
        <button className={`chip${today ? ' on' : ''}`} onClick={() => setToday(!today)}>Available today</button>
        <button className={`chip${rating ? ' on' : ''}`} onClick={() => setRating(rating ? 0 : 4.5)}>Rating 4.5+</button>
        <button className={`chip${newPatients ? ' on' : ''}`} onClick={() => setNewPatients(!newPatients)}>New patients</button>
        <button className={`chip${weekends ? ' on' : ''}`} onClick={() => setWeekends(!weekends)}>Open weekends</button>
        {insurance && <button className="chip on" onClick={() => setInsurance('')}>In-network: {insurance} ✕</button>}
        {bounds && <button className="chip on" onClick={() => setBounds(null)}>Map area ✕</button>}
        <div className="grow" />
        <label className="sort">Sort:
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="nearest">Nearest</option>
            <option value="soonest">Soonest available</option>
            <option value="rating">Highest rated</option>
            <option value="reviews">Most reviewed</option>
            <option value="price">Lowest price</option>
          </select>
        </label>
      </div>

      {filtersOpen && (
        <div className="filters-panel">
          <label>Insurance<select value={insurance} onChange={(e) => setInsurance(e.target.value)}><option value="">Any / self-pay</option>{INSURANCE.map((i) => <option key={i}>{i}</option>)}</select></label>
          <label>Max price<select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}><option value={0}>Any</option>{[80, 100, 120, 150, 200, 300].map((p) => <option key={p} value={p}>Up to ${p}</option>)}</select></label>
          <label>Minimum rating<select value={rating} onChange={(e) => setRating(Number(e.target.value))}><option value={0}>Any</option>{[4, 4.5, 4.8].map((p) => <option key={p} value={p}>{p}+</option>)}</select></label>
          <label>Language<select value={lang} onChange={(e) => setLang(e.target.value)}><option value="">Any</option>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
          <div className="fp-actions"><button className="link" onClick={reset}>Clear all</button><button className="btn" onClick={() => setFiltersOpen(false)}>Show {filtered.length} clinics</button></div>
        </div>
      )}

      <div className={`results-layout view-${view}`}>
        <section className="results" ref={listRef}>
          <div className="results-head">
            <h1>{now ? `${filtered.length} dental clinics` : 'Loading clinics…'}<span> in {bounds ? 'this map area' : CITIES[city].name}</span></h1>
            {filtered.length > 0 && <small>Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)}</small>}
          </div>

          {now && filtered.length === 0 && (
            <div className="empty">
              <b>No clinics match these filters.</b>
              <p>Try removing a filter or zooming out on the map.</p>
              <button className="btn" onClick={reset}>Clear filters</button>
            </div>
          )}

          {shown.map((c) => (
            <article id={'card-' + c.id} key={c.id} className={`card-clinic${c.id === selected ? ' sel' : ''}${c.id === hovered ? ' hov' : ''}`}
              onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}>
              <Link href={`/clinic/${c.id}/`} className="photo" style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }} aria-label={c.name}>
                <span className="photo-mark">{c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
              </Link>
              <div className="info">
                <div className="row-between">
                  <Link href={`/clinic/${c.id}/`} className="name">{c.name}</Link>
                  <button className="locate" title="Show on map" onClick={() => { setSelected(c.id); setView('map'); }}>◎</button>
                </div>
                <p className="meta">★ {c.rating.toFixed(1)} ({c.reviewCount}) · {c.distance.toFixed(1)} mi · {c.address}</p>
                <div className="tags">
                  {insurance && c.insurance.includes(insurance) && <span className="tag green">In-network</span>}
                  {c.newPatients && <span className="tag">New patients</span>}
                  {c.languages.length > 1 && <span className="tag">{c.languages.slice(1).join(', ')}</span>}
                  {c.weekends && <span className="tag">Sat</span>}
                </div>
                <div className="slots">
                  {c.slots.length ? c.slots.map((s) => (
                    <Link key={s.day.toISOString() + s.time} href={`/clinic/${c.id}/?service=${service}&day=${dayKey(s.day)}&time=${encodeURIComponent(s.time)}`} className="slot">
                      {now && dayLabel(s.day, now)} {s.time}
                    </Link>
                  )) : <span className="muted">No online slots this week</span>}
                </div>
                <p className="price">{c.svc?.name} <b>{c.fromPrice ? `$${c.fromPrice}` : 'Free'}</b></p>
              </div>
            </article>
          ))}

          {pages > 1 && (
            <div className="pager">
              <button disabled={page === 1} onClick={() => { setPage(page - 1); listRef.current?.scrollTo({ top: 0 }); }}>‹</button>
              {Array.from({ length: pages }, (_, i) => <button key={i} className={page === i + 1 ? 'on' : ''} onClick={() => { setPage(i + 1); listRef.current?.scrollTo({ top: 0 }); }}>{i + 1}</button>)}
              <button disabled={page === pages} onClick={() => { setPage(page + 1); listRef.current?.scrollTo({ top: 0 }); }}>›</button>
            </div>
          )}
          <p className="demo-note">Demo project — clinics, dentists and reviews are fictional.</p>
        </section>

        <section className="map-wrap">
          <MapView clinics={filtered} center={center} hoveredId={hovered} selectedId={selected}
            onSelect={setSelected} onHover={setHovered} onMoved={(b) => setPending(b)} />
          {pending && (
            <button className="search-area" onClick={() => { setBounds(pending); setPending(null); setSelected(null); }}>↻ Search this area</button>
          )}
        </section>
      </div>

      <button className="view-toggle" onClick={() => setView(view === 'list' ? 'map' : 'list')}>{view === 'list' ? '◎ Map' : '☰ List'}</button>
    </div>
  );
}

function toMin(t: string) { const [hm, ap] = t.split(' '); let [h, m] = hm.split(':').map(Number); if (ap === 'PM' && h !== 12) h += 12; return h * 60 + m; }
