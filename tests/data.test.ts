import { describe, expect, it } from 'vitest';
import { addDays, clinics, dayKey, dayLabel, distanceMi, getClinic, nextSlots, nowIn, slotsFor, toMinutes } from '@/lib/data';
import { takenFor, type Booking } from '@/lib/bookings';

const clinic = getClinic('aus-01')!;

describe('dayKey', () => {
  it('uses the local calendar date, not UTC', () => {
    expect(dayKey(new Date(2026, 9, 8, 0, 30))).toBe('2026-10-08');
    expect(dayKey(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
  });
  it('pads month and day', () => expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05'));
});

describe('nowIn', () => {
  it('converts an instant to the clinic wall clock', () => {
    const at = new Date('2026-10-07T14:21:00Z'); // 09:21 in Austin (CDT, UTC-5)
    const n = nowIn('austin', at);
    expect([n.getHours(), n.getMinutes()]).toEqual([9, 21]);
    expect(dayKey(n)).toBe('2026-10-07');
  });
  it('is still the previous day in the US while Europe is already on the next one', () => {
    expect(dayKey(nowIn('miami', new Date('2026-10-08T01:30:00Z')))).toBe('2026-10-07');
  });
});

describe('slots', () => {
  const monday = new Date(2026, 9, 12, 12);
  it('is deterministic per clinic and day', () => expect(slotsFor(clinic, monday)).toEqual(slotsFor(clinic, monday)));
  it('is closed on Sundays', () => expect(slotsFor(clinic, new Date(2026, 9, 11, 12))).toEqual([]));
  it('hides slots that are already taken', () => {
    const free = slotsFor(clinic, monday);
    expect(free.length).toBeGreaterThan(0);
    const taken = (_d: string, t: string) => t === free[0];
    expect(slotsFor(clinic, monday, 'any', taken)).toEqual(free.slice(1));
  });
  it('nextSlots skips times that already passed today', () => {
    const now = new Date(2026, 9, 12, 23, 0);
    const first = nextSlots(clinic, now, 1)[0];
    expect(dayKey(first.day)).not.toBe(dayKey(now));
  });
  it('nextSlots returns at most n slots in chronological order', () => {
    const s = nextSlots(clinic, new Date(2026, 9, 12, 6, 0), 3);
    expect(s.length).toBeLessThanOrEqual(3);
    const stamp = s.map((x) => x.day.getTime() + toMinutes(x.time) * 6e4);
    expect(stamp).toEqual([...stamp].sort((a, b) => a - b));
  });
});

describe('takenFor', () => {
  const b = (over: Partial<Booking>): Booking => ({
    id: 'BK-1',
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
    ...over,
  });
  it('blocks the clinic-wide list and the booked dentist only', () => {
    const t = takenFor('aus-01', [b({})]);
    expect(t('2026-10-12', '9:00 AM', 'any')).toBe(true);
    expect(t('2026-10-12', '9:00 AM', 'd1')).toBe(true);
    expect(t('2026-10-12', '9:00 AM', 'd0')).toBe(false);
    expect(t('2026-10-12', '10:30 AM', 'any')).toBe(false);
  });
  it('ignores other clinics and no-shows', () => {
    expect(takenFor('aus-01', [b({ clinicId: 'den-01' })])('2026-10-12', '9:00 AM', 'any')).toBe(false);
    expect(takenFor('aus-01', [b({ status: 'noshow' })])('2026-10-12', '9:00 AM', 'any')).toBe(false);
  });
});

describe('misc', () => {
  it('generates 150 clinics with unique ids', () => {
    expect(clinics).toHaveLength(150);
    expect(new Set(clinics.map((c) => c.id)).size).toBe(150);
  });
  it('dayLabel', () => {
    const today = new Date(2026, 9, 8, 12);
    expect(dayLabel(today, today)).toBe('Today');
    expect(dayLabel(addDays(today, 1), today)).toBe('Tomorrow');
  });
  it('distanceMi is ~0 for the same point and symmetric', () => {
    expect(distanceMi([-97.7, 30.2], [-97.7, 30.2])).toBeCloseTo(0);
    expect(distanceMi([-97.7, 30.2], [-97.8, 30.3])).toBeCloseTo(distanceMi([-97.8, 30.3], [-97.7, 30.2]));
  });
});
