'use client';
import { addDays, dayKey, getClinic, slotsFor, toMinutes, SERVICES } from './data';
import { loadBookings, type Booking } from './bookings';

export type Appt = {
  id: string; dentistId: string; serviceId: string; patient: string; phone: string;
  day: string; start: number; minutes: number; status: Booking['status']; source: 'phone' | 'online'; price: number;
};

const PATIENTS = ['Megan Taylor', 'Daniel Kim', 'Sofia Martinez', 'Ryan Brooks', 'Carlos Ramirez', 'Olivia Chen', 'Hannah Wright', 'Mark Davis', 'Ethan Moore', 'Ava Johnson', 'Noah Wilson', 'Lily Anderson', 'Jack Thomas', 'Emma Garcia', 'Liam Robinson', 'Mia Clark', 'Lucas Lewis', 'Chloe Walker', 'Mason Hall', 'Zoe Allen', 'Logan Young', 'Ella King', 'Aiden Scott', 'Grace Green'];

function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

/** Seeded appointments for the flagship clinic + anything booked on the public site. */
export function appointmentsFor(clinicId: string, from: Date, days: number): Appt[] {
  const c = getClinic(clinicId)!;
  const out: Appt[] = [];
  const today = dayKey(new Date());
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i); const k = dayKey(d);
    const r = rng(Number(k.replace(/-/g, '')));
    if (d.getDay() === 0) continue;
    c.dentists.forEach((den, di) => {
      // slots NOT offered online are the ones already taken
      const free = new Set(slotsFor(c, d, den.id));
      const all = d.getDay() === 6 ? ['8:00 AM', '9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM'] : ['8:00 AM', '9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM', '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM', '4:00 PM', '4:45 PM'];
      for (const t of all) {
        if (free.has(t) || r() < 0.25) continue;
        const svc = di === 3 ? SERVICES[0] : SERVICES[Math.floor(r() * 5)];
        const priceSvc = c.services.find((s) => s.id === svc.id);
        const past = k < today;
        const roll = r();
        const status: Booking['status'] = past ? (roll < 0.07 ? 'noshow' : 'arrived') : k === today ? (roll < 0.4 ? 'arrived' : roll < 0.85 ? 'confirmed' : 'pending') : roll < 0.8 ? 'confirmed' : 'pending';
        out.push({ id: `${k}-${den.id}-${t}`, dentistId: den.id, serviceId: svc.id, patient: PATIENTS[Math.floor(r() * PATIENTS.length)], phone: `(512) 555-0${100 + Math.floor(r() * 899)}`, day: k, start: toMinutes(t), minutes: Math.min(svc.minutes, 45), status, source: r() < 0.45 ? 'online' : 'phone', price: priceSvc?.price ?? svc.base });
      }
    });
  }
  for (const b of loadBookings().filter((b) => b.clinicId === clinicId)) {
    const svc = c.services.find((s) => s.id === b.serviceId);
    out.push({ id: b.id, dentistId: b.dentistId, serviceId: b.serviceId, patient: b.name, phone: b.phone, day: b.day, start: toMinutes(b.time), minutes: Math.min(svc?.minutes ?? 45, 45), status: b.status, source: 'online', price: svc?.price ?? 0 });
  }
  return out;
}
