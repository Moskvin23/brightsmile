'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CITIES, dayLabel, getClinic, nextSlots, nowIn, SERVICES, type Clinic } from '@/lib/data';
import { loadBookings, takenFor, type Booking } from '@/lib/bookings';
import { loadCompare, saveCompare } from '@/lib/compare';
import Select from './Select';

export default function CompareView() {
  const [ids, setIds] = useState<string[] | null>(null);
  const [service, setService] = useState('cleaning');
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fromUrl = (new URLSearchParams(window.location.search).get('ids') ?? '').split(',').filter((x) => getClinic(x));
    setIds(fromUrl.length ? fromUrl.slice(0, 3) : loadCompare());
    // keep "next available" in sync with bookings made in another tab
    const refresh = () => setBookings(loadBookings());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const cs = useMemo(() => (ids ?? []).map((id) => getClinic(id)).filter((c): c is Clinic => !!c), [ids]);
  const nextLabels = useMemo(
    () =>
      Object.fromEntries(
        cs.map((c) => {
          const n = nowIn(c.city);
          const s = nextSlots(c, n, 1, takenFor(c.id, bookings))[0];
          return [c.id, s ? `${dayLabel(s.day, n)} ${s.time}` : 'No slots this week'];
        }),
      ),
    [cs, bookings],
  );

  if (!ids) return <p className="muted">Loading…</p>;
  const remove = (id: string) => {
    const n = ids.filter((x) => x !== id);
    setIds(n);
    saveCompare(n);
  };

  if (cs.length < 2) {
    return (
      <div className="empty">
        <b>Pick at least two clinics to compare.</b>
        <p>Tick “Compare” on clinic cards in the search results.</p>
        <Link className="btn" href="/search/">
          Find a dentist
        </Link>
      </div>
    );
  }

  const price = (c: Clinic) => c.services.find((s) => s.id === service)?.price;
  const prices = cs.map(price).filter((p): p is number => p !== undefined);
  const best = prices.length ? Math.min(...prices) : undefined;
  const top = Math.max(...cs.map((c) => c.rating));
  const next = (c: Clinic) => nextLabels[c.id];
  const rows: [string, (c: Clinic) => React.ReactNode][] = [
    [
      'Rating',
      (c) => (
        <span className={c.rating === top ? 'win' : ''}>
          ★ {c.rating.toFixed(1)} <span className="muted">({c.reviewCount} reviews)</span>
        </span>
      ),
    ],
    [
      'Price',
      (c) => {
        const p = price(c);
        return p === undefined ? <span className="muted">Not offered</span> : <span className={p === best ? 'win' : ''}>{p ? `$${p}` : 'Free'}</span>;
      },
    ],
    ['Next available', next],
    ['City', (c) => CITIES[c.city].name],
    ['Insurance', (c) => c.insurance.join(', ')],
    ['Languages', (c) => c.languages.join(', ')],
    ['New patients', (c) => (c.newPatients ? '✓ Accepting' : '— Not accepting')],
    ['Open Saturdays', (c) => (c.weekends ? '✓ Yes' : '— No')],
    ['Dentists', (c) => c.dentists.length],
  ];

  return (
    <>
      <div className="admin-top">
        <h1>Compare clinics</h1>
        <div className="field" style={{ minWidth: 240 }}>
          <span>Compare price for</span>
          <Select ariaLabel="Service" value={service} onChange={setService} options={SERVICES.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
      </div>
      <div className="dtable compare">
        <div className="cmp-grid" style={{ gridTemplateColumns: `160px repeat(${cs.length}, minmax(200px, 1fr))` }}>
          <div />
          {cs.map((c) => (
            <div key={c.id} className="cmp-head">
              <i style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }} aria-hidden="true" />
              <Link href={`/clinic/${c.id}/`} className="strong">
                {c.name}
              </Link>
              <button className="link" onClick={() => remove(c.id)}>
                Remove
              </button>
            </div>
          ))}
          {rows.map(([label, fn]) => (
            <div key={label} className="cmp-row">
              <div className="cmp-label">{label}</div>
              {cs.map((c) => (
                <div key={c.id}>{fn(c)}</div>
              ))}
            </div>
          ))}
          <div className="cmp-row">
            <div />
            {cs.map((c) => (
              <div key={c.id}>
                <Link className="btn" href={`/clinic/${c.id}/?service=${service}`}>
                  Book
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
