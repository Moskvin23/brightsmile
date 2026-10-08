'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dayKey, getClinic, nowIn, SERVICES, toMinutes } from '@/lib/data';
import { loadBookings, removeBooking, type Booking } from '@/lib/bookings';
import Modal from './Modal';

const label = (b: Booking) => new Date(b.day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.name ?? id;

function isUpcoming(b: Booking) {
  const c = getClinic(b.clinicId);
  const n = c ? nowIn(c.city) : new Date();
  return b.day > dayKey(n) || (b.day === dayKey(n) && toMinutes(b.time) > n.getHours() * 60 + n.getMinutes());
}

export default function MyBookings() {
  const [list, setList] = useState<Booking[] | null>(null);
  const [user, setUser] = useState('');
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [toast, setToast] = useState('');

  const refresh = () => setList(loadBookings().sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time)));
  useEffect(() => {
    refresh();
    try {
      setUser(JSON.parse(localStorage.getItem('brightsmile.user') || 'null')?.name ?? '');
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!list) return <p className="muted">Loading…</p>;
  const upcoming = list.filter(isUpcoming);
  const past = list.filter((b) => !isUpcoming(b)).reverse();

  const row = (b: Booking, canEdit: boolean) => {
    const c = getClinic(b.clinicId);
    const d = c?.dentists.find((x) => x.id === b.dentistId);
    return (
      <article key={b.id} className="booking-row">
        <div>
          <b>{svcName(b.serviceId)}</b>
          <p>
            {label(b)} · {b.time}
          </p>
          <p className="muted">
            {c ? <Link href={`/clinic/${c.id}/`}>{c.name}</Link> : 'Clinic'}
            {d ? ` · ${d.name}` : ''} · Booking {b.id}
          </p>
        </div>
        {canEdit ? (
          <div className="row-gap">
            <Link className="btn ghost" href={`/clinic/${b.clinicId}/?service=${b.serviceId}&reschedule=${b.id}`}>
              Reschedule
            </Link>
            <button className="btn ghost danger" onClick={() => setCancel(b)}>
              Cancel
            </button>
          </div>
        ) : (
          c && (
            <Link className="btn ghost" href={`/clinic/${c.id}/?service=${b.serviceId}`}>
              Book again
            </Link>
          )
        )}
      </article>
    );
  };

  return (
    <>
      <h1>{user ? `${user.split(' ')[0]}’s bookings` : 'My bookings'}</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Bookings are stored in this browser (demo — there is no account backend).
      </p>
      {list.length === 0 && (
        <div className="empty">
          <b>No bookings yet.</b>
          <p>Find a clinic and book your first visit in under a minute.</p>
          <Link href="/search/" className="btn">
            Find a dentist
          </Link>
        </div>
      )}
      {upcoming.length > 0 && (
        <>
          <h2 className="h2s">Upcoming</h2>
          <div className="stack wide">{upcoming.map((b) => row(b, true))}</div>
        </>
      )}
      {past.length > 0 && (
        <>
          <h2 className="h2s">Past</h2>
          <div className="stack wide">{past.map((b) => row(b, false))}</div>
        </>
      )}
      {cancel && (
        <Modal title="Cancel booking" onClose={() => setCancel(null)}>
          <h3>Cancel this visit?</h3>
          <p>
            {svcName(cancel.serviceId)} on {label(cancel)} at {cancel.time}. Your deposit is refunded and the time slot becomes available again.
          </p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setCancel(null)}>
              Keep it
            </button>
            <button
              className="btn danger-fill"
              onClick={() => {
                removeBooking(cancel.id);
                setCancel(null);
                refresh();
                setToast('Booking cancelled');
              }}
            >
              Cancel booking
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
