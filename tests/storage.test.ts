import { beforeEach, describe, expect, it } from 'vitest';
import { clinicTimeToUtc } from '@/lib/data';
import { loadBookings, takenFor, type Booking } from '@/lib/bookings';
import { loadFavorites } from '@/lib/favorites';
import { loadCompare } from '@/lib/compare';

// minimal in-memory localStorage for the node test environment
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
});

describe('storage readers survive corrupted data', () => {
  it.each(['null', '{}', '"text"', '42', '{not json'])('bookings: %s', (raw) => {
    store.set('brightsmile.bookings', raw);
    expect(loadBookings()).toEqual([]);
  });
  it('bookings: drops malformed entries but keeps valid ones', () => {
    const ok = { id: 'BK-1', clinicId: 'aus-01', dentistId: 'd0', serviceId: 'cleaning', day: '2026-10-12', time: '9:00 AM' };
    store.set('brightsmile.bookings', JSON.stringify([ok, null, 5, { id: 1 }]));
    expect(loadBookings()).toEqual([ok]);
  });
  it.each(['null', '{}', '"x"'])('favorites and compare: %s', (raw) => {
    store.set('brightsmile.favorites', raw);
    store.set('brightsmile.compare', raw);
    expect(loadFavorites()).toEqual([]);
    expect(loadCompare()).toEqual([]);
  });
  it('favorites: keeps only strings', () => {
    store.set('brightsmile.favorites', JSON.stringify(['aus-01', 7, null]));
    expect(loadFavorites()).toEqual(['aus-01']);
  });
});

describe('rescheduling', () => {
  const b: Booking = {
    id: 'BK-OLD',
    clinicId: 'aus-01',
    dentistId: 'd1',
    serviceId: 'cleaning',
    day: '2026-10-12',
    time: '9:00 AM',
    name: 'T',
    email: '',
    phone: '',
    createdAt: 0,
    status: 'online',
  };
  it('the booking being moved does not block its own slot', () => {
    expect(takenFor('aus-01', [b])('2026-10-12', '9:00 AM', 'any')).toBe(true);
    expect(takenFor('aus-01', [b], 'BK-OLD')('2026-10-12', '9:00 AM', 'any')).toBe(false);
  });
});

describe('clinicTimeToUtc', () => {
  it('summer time (CDT, UTC-5)', () => expect(clinicTimeToUtc('austin', '2026-10-08', 8 * 60).toISOString()).toBe('2026-10-08T13:00:00.000Z'));
  it('winter time (CST, UTC-6)', () => expect(clinicTimeToUtc('austin', '2026-01-15', 8 * 60).toISOString()).toBe('2026-01-15T14:00:00.000Z'));
  it('other zones', () => {
    expect(clinicTimeToUtc('denver', '2026-10-08', 9 * 60).toISOString()).toBe('2026-10-08T15:00:00.000Z'); // MDT, UTC-6
    expect(clinicTimeToUtc('miami', '2026-10-08', 9 * 60).toISOString()).toBe('2026-10-08T13:00:00.000Z'); // EDT, UTC-4
  });
  it('is correct right after the November daylight-saving change (CST from 1 Nov 2026)', () => {
    expect(clinicTimeToUtc('austin', '2026-11-01', 10 * 60).toISOString()).toBe('2026-11-01T16:00:00.000Z');
  });
});
