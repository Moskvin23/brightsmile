'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CITIES, CityKey, clinics, distanceMi, dayLabel, INSURANCE, LANGUAGES, nextSlots, nowIn, SERVICES, dayKey } from '@/lib/data';
import { loadBookings, takenFor, type Booking } from '@/lib/bookings';
import { loadFavorites, saveFavorites } from '@/lib/favorites';
import { loadCompare, saveCompare, MAX_COMPARE } from '@/lib/compare';
import Logo from './Logo';
import ClinicCard from './ClinicCard';
import Select, { type Opt } from './Select';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map map-loading" /> });

type Sort = 'nearest' | 'rating' | 'price' | 'soonest' | 'reviews';
const PAGE = 10;

const SORTS: Opt[] = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'soonest', label: 'Soonest available' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'price', label: 'Lowest price' },
];
const PRICES: Opt[] = [{ value: '0', label: 'Any price' }, ...[80, 100, 120, 150, 200, 300].map((p) => ({ value: String(p), label: `Up to $${p}` }))];
const RATINGS: Opt[] = [{ value: '0', label: 'Any' }, ...[4, 4.5, 4.8].map((r) => ({ value: String(r), label: `${r}+` }))];
const SERVICE_OPTS: Opt[] = SERVICES.map((s) => ({ value: s.id, label: s.name }));
const CITY_OPTS: Opt[] = (Object.keys(CITIES) as CityKey[]).map((k) => ({ value: k, label: CITIES[k].name }));
const INS_OPTS: Opt[] = [{ value: '', label: 'Any / self-pay' }, ...INSURANCE.map((i) => ({ value: i, label: i }))];
const LANG_OPTS: Opt[] = [{ value: '', label: 'Any language' }, ...LANGUAGES.map((l) => ({ value: l, label: l }))];

export default function Search() {
  const [instant, setInstant] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [city, setCity] = useState<CityKey>('austin');
  const [service, setService] = useState('cleaning');
  const [insurance, setInsurance] = useState('');
  const [today, setToday] = useState(false);
  const [rating, setRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [lang, setLang] = useState('');
  const [newPatients, setNewPatients] = useState(false);
  const [weekends, setWeekends] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>('nearest');
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [pending, setPending] = useState<[number, number, number, number] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInstant(new Date());
    setBookings(loadBookings());
    setFavs(loadFavorites());
    setCompare(loadCompare());
    // pick up bookings made in another tab, or after coming back to this one
    const refresh = () => setBookings(loadBookings());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const q = new URLSearchParams(window.location.search).get('city') as CityKey | null;
    if (q && q in CITIES) setCity(q);
    const sv = new URLSearchParams(window.location.search).get('service');
    if (sv && SERVICES.some((x) => x.id === sv)) setService(sv);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const center = CITIES[city].center;
  // availability is judged on the clinic's own clock, not the visitor's
  const now = useMemo(() => (instant ? nowIn(city, instant) : null), [instant, city]);

  const enriched = useMemo(() => {
    if (!now) return [];
    return clinics
      .filter((c) => c.city === city && c.status === 'Active')
      .map((c) => {
        const svc = c.services.find((s) => s.id === service);
        const slots = nextSlots(c, now, 3, takenFor(c.id, bookings));
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
  }, [city, service, now, center, bookings]);

  const filtered = useMemo(() => {
    let r = enriched.filter(
      (c) =>
        c.svc &&
        (!insurance || c.insurance.includes(insurance)) &&
        (!today || (now && c.slots[0] && dayKey(c.slots[0].day) === dayKey(now))) &&
        c.rating >= rating &&
        (!maxPrice || c.fromPrice <= maxPrice) &&
        (!lang || c.languages.includes(lang)) &&
        (!newPatients || c.newPatients) &&
        (!weekends || c.weekends) &&
        (!savedOnly || favs.includes(c.id)) &&
        (!bounds || (c.lng >= bounds[0] && c.lat >= bounds[1] && c.lng <= bounds[2] && c.lat <= bounds[3])),
    );
    const cmp: Record<Sort, (a: (typeof r)[0], b: (typeof r)[0]) => number> = {
      nearest: (a, b) => a.distance - b.distance,
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      price: (a, b) => a.fromPrice - b.fromPrice,
      // Infinity - Infinity is NaN, so compare explicitly (clinics without slots go last)
      soonest: (a, b) => (a.soonest === b.soonest ? 0 : a.soonest < b.soonest ? -1 : 1),
      reviews: (a, b) => b.reviewCount - a.reviewCount,
    };
    r = [...r].sort(cmp[sort]);
    return r;
  }, [enriched, insurance, today, rating, maxPrice, lang, newPatients, weekends, bounds, sort, now, savedOnly, favs]);

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

  const activeCount = [insurance, today, rating, maxPrice, lang, newPatients, weekends, savedOnly].filter(Boolean).length;
  const toggleFav = (id: string) => {
    const n = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    setFavs(n);
    saveFavorites(n);
    if (!n.length) setSavedOnly(false);
  };
  const toggleCompare = (id: string) => {
    const n = compare.includes(id) ? compare.filter((x) => x !== id) : [...compare, id].slice(0, MAX_COMPARE);
    setCompare(n);
    saveCompare(n);
  };
  const runSearch = () => {
    setFiltersOpen(false);
    setView('list');
    setPage(1);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const reset = () => {
    setInsurance('');
    setToday(false);
    setRating(0);
    setMaxPrice(0);
    setLang('');
    setNewPatients(false);
    setWeekends(false);
    setSavedOnly(false);
    setBounds(null);
  };
  const switchCity = (c: CityKey) => {
    setCity(c);
    setBounds(null);
    setPending(null);
    setSelected(null);
    setFocus(null);
  };
  const showOnMap = (id: string) => {
    setSelected(id);
    setFocus({ id, n: Date.now() });
  };
  const sortLabel = SORTS.find((o) => o.value === sort)!.label;

  return (
    <div className="search-page">
      <header className="topbar">
        <Logo />
        <div className="searchbar">
          <div className="sb-field">
            <span>Service</span>
            <Select variant="bare" ariaLabel="Service" value={service} onChange={setService} options={SERVICE_OPTS} />
          </div>
          <div className="sb-field">
            <span>Location</span>
            <Select variant="bare" ariaLabel="Location" value={city} onChange={(v) => switchCity(v as CityKey)} options={CITY_OPTS} />
          </div>
          <div className="sb-field hide-sm">
            <span>Insurance</span>
            <Select variant="bare" ariaLabel="Insurance" value={insurance} onChange={setInsurance} options={INS_OPTS} />
          </div>
          <button className="sb-go" onClick={runSearch}>
            Search
          </button>
        </div>
        <nav className="top-links">
          <Link href="/for-clinics/">For clinics</Link>
          <Link href="/login/" className="pill-btn">
            Log in
          </Link>
        </nav>
      </header>

      <div className="filterbar">
        <button className={`chip${filtersOpen ? ' on' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}>
          ⚙ Filters{activeCount ? ` · ${activeCount}` : ''}
        </button>
        <button className={`chip${today ? ' on' : ''}`} onClick={() => setToday(!today)}>
          Available today
        </button>
        <button className={`chip${rating ? ' on' : ''}`} onClick={() => setRating(rating ? 0 : 4.5)}>
          Rating 4.5+{rating ? ' ✕' : ''}
        </button>
        {insurance && (
          <button className="chip on" onClick={() => setInsurance('')}>
            In-network: {insurance} ✕
          </button>
        )}
        <Select
          variant="chip"
          ariaLabel="Price"
          value={String(maxPrice)}
          onChange={(v) => setMaxPrice(Number(v))}
          options={PRICES}
          active={!!maxPrice}
          display={maxPrice ? `Up to $${maxPrice}` : 'Price'}
        />
        <Select variant="chip" ariaLabel="Language" value={lang} onChange={setLang} options={LANG_OPTS} active={!!lang} display={lang || 'Language'} />
        <button className={`chip${newPatients ? ' on' : ''}`} onClick={() => setNewPatients(!newPatients)}>
          Accepts new patients
        </button>
        <button className={`chip${weekends ? ' on' : ''}`} onClick={() => setWeekends(!weekends)}>
          Open weekends
        </button>
        {favs.length > 0 && (
          <button className={`chip${savedOnly ? ' on' : ''}`} onClick={() => setSavedOnly(!savedOnly)}>
            ♥ Saved · {favs.length}
          </button>
        )}
        {bounds && (
          <button className="chip on" onClick={() => setBounds(null)}>
            Map area ✕
          </button>
        )}
        <div className="grow" />
        <Select
          variant="chip"
          ariaLabel="Sort by"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={SORTS}
          display={`Sort: ${sortLabel}`}
          className="sort-btn"
        />
      </div>

      {filtersOpen && (
        <div className="filters-panel">
          <div className="fp-field">
            Insurance
            <Select ariaLabel="Insurance" value={insurance} onChange={setInsurance} options={INS_OPTS} />
          </div>
          <div className="fp-field">
            Max price
            <Select ariaLabel="Max price" value={String(maxPrice)} onChange={(v) => setMaxPrice(Number(v))} options={PRICES} />
          </div>
          <div className="fp-field">
            Minimum rating
            <Select ariaLabel="Minimum rating" value={String(rating)} onChange={(v) => setRating(Number(v))} options={RATINGS} />
          </div>
          <div className="fp-field">
            Language
            <Select ariaLabel="Language" value={lang} onChange={setLang} options={LANG_OPTS} />
          </div>
          <div className="fp-actions">
            <button className="link" onClick={reset}>
              Clear all
            </button>
            <button className="btn" onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} clinics
            </button>
          </div>
        </div>
      )}

      <div className={`results-layout view-${view}`}>
        <section className="results" id="main" ref={listRef}>
          <div className="results-head">
            <h1>
              {now ? `${filtered.length} dental clinics` : 'Loading clinics…'}
              <span> in {bounds ? 'this map area' : CITIES[city].name}</span>
            </h1>
            {filtered.length > 0 && (
              <small>
                Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)}
              </small>
            )}
          </div>

          {!now && Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton card-skel" aria-hidden="true" />)}
          {now && filtered.length === 0 && (
            <div className="empty">
              <b>No clinics match these filters.</b>
              <p>Try removing a filter or zooming out on the map.</p>
              <button className="btn" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}

          {shown.map((c) => (
            <ClinicCard
              key={c.id}
              c={c}
              now={now}
              service={service}
              insurance={insurance}
              selected={c.id === selected}
              hovered={c.id === hovered}
              saved={favs.includes(c.id)}
              compared={compare.includes(c.id)}
              compareFull={compare.length >= MAX_COMPARE}
              onHover={setHovered}
              onFocus={showOnMap}
              onLocate={(id) => {
                showOnMap(id);
                setView('map');
              }}
              onToggleSaved={toggleFav}
              onToggleCompare={toggleCompare}
            />
          ))}

          {pages > 1 && (
            <div className="pager">
              <button
                disabled={page === 1}
                onClick={() => {
                  setPage(page - 1);
                  listRef.current?.scrollTo({ top: 0 });
                }}
              >
                ‹
              </button>
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  className={page === i + 1 ? 'on' : ''}
                  onClick={() => {
                    setPage(i + 1);
                    listRef.current?.scrollTo({ top: 0 });
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === pages}
                onClick={() => {
                  setPage(page + 1);
                  listRef.current?.scrollTo({ top: 0 });
                }}
              >
                ›
              </button>
            </div>
          )}
          <p className="demo-note">Demo project — clinics, dentists and reviews are fictional.</p>
        </section>

        <section className="map-wrap">
          <MapView
            clinics={filtered}
            center={center}
            hoveredId={hovered}
            selectedId={selected}
            focus={focus}
            onSelect={setSelected}
            onHover={setHovered}
            onMoved={(b) => setPending(b)}
          />
          {pending && (
            <button
              className="search-area"
              onClick={() => {
                setBounds(pending);
                setPending(null);
                setSelected(null);
              }}
            >
              ↻ Search this area
            </button>
          )}
        </section>
      </div>

      {compare.length > 0 && (
        <div className="compare-bar" role="region" aria-label="Compare clinics">
          <span>
            {compare.length} selected{compare.length < 2 ? ' — pick one more' : ''}
          </span>
          <Link
            className={`btn${compare.length < 2 ? ' disabled' : ''}`}
            aria-disabled={compare.length < 2}
            href={compare.length < 2 ? '#' : `/compare/?ids=${compare.join(',')}`}
          >
            Compare
          </Link>
          <button
            className="link"
            onClick={() => {
              setCompare([]);
              saveCompare([]);
            }}
          >
            Clear
          </button>
        </div>
      )}
      <button className="view-toggle" onClick={() => setView(view === 'list' ? 'map' : 'list')}>
        {view === 'list' ? '◎ Map' : '☰ List'}
      </button>
    </div>
  );
}

function toMin(t: string) {
  const [hm, ap] = t.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (ap === 'PM' && h !== 12) h += 12;
  return h * 60 + m;
}
