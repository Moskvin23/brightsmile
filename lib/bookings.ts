'use client';
// Demo persistence: bookings made on the public site are kept in localStorage,
// so they show up in the clinic admin calendar in the same browser.
import type { TakenFn } from './data';

export type Booking = {
  id: string;
  clinicId: string;
  dentistId: string;
  serviceId: string;
  day: string; // YYYY-MM-DD
  time: string;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
  source?: 'phone' | 'online'; // set when the clinic adds it in the admin
  status: 'online' | 'confirmed' | 'arrived' | 'pending' | 'noshow';
};

const KEY = 'brightsmile.bookings';

function isBooking(b: unknown): b is Booking {
  const x = b as Partial<Booking> | null;
  return !!x && typeof x === 'object' && ['id', 'clinicId', 'dentistId', 'serviceId', 'day', 'time'].every((k) => typeof x[k as keyof Booking] === 'string');
}

export function loadBookings(): Booking[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    // corrupted or hand-edited data must never crash the pages that read bookings
    return Array.isArray(raw) ? raw.filter(isBooking) : [];
  } catch {
    return [];
  }
}

export function saveBooking(b: Omit<Booking, 'id' | 'createdAt' | 'status'> & { status?: Booking['status'] }): Booking {
  const full: Booking = { ...b, id: 'BK-' + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: Date.now(), status: b.status ?? 'online' };
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadBookings(), full]));
  } catch {
    /* private mode */
  }
  return full;
}

export function removeBooking(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadBookings().filter((b) => b.id !== id)));
  } catch {
    /* ignore */
  }
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadBookings().map((b) => (b.id === id ? { ...b, ...patch } : b))));
  } catch {
    /* ignore */
  }
}

/**
 * Slot-blocking predicate for one clinic. A booking blocks the "first available" list for its time
 * (the clinic is at capacity there) and the booked dentist's own list.
 */
export function takenFor(clinicId: string, bookings: Booking[] = loadBookings(), ignoreId = ''): TakenFn {
  // `ignoreId` is the booking being rescheduled: its own slot must stay selectable
  const mine = bookings.filter((b) => b.clinicId === clinicId && b.status !== 'noshow' && b.id !== ignoreId);
  return (day, time, dentistId) => mine.some((b) => b.day === day && b.time === time && (dentistId === 'any' || b.dentistId === dentistId));
}
