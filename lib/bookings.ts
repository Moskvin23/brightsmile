'use client';
// Demo persistence: bookings made on the public site are kept in localStorage,
// so they show up in the clinic admin calendar in the same browser.

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
  status: 'online' | 'confirmed' | 'arrived' | 'pending' | 'noshow';
};

const KEY = 'brightsmile.bookings';

export function loadBookings(): Booking[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveBooking(b: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
  const full: Booking = { ...b, id: 'BK-' + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: Date.now(), status: 'online' };
  try { localStorage.setItem(KEY, JSON.stringify([...loadBookings(), full])); } catch { /* private mode */ }
  return full;
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  try { localStorage.setItem(KEY, JSON.stringify(loadBookings().map((b) => (b.id === id ? { ...b, ...patch } : b)))); } catch { /* ignore */ }
}
