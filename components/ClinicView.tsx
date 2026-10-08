'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { addDays, CITIES, clinicTimeToUtc, dayKey, DEPOSIT, getClinic, nowIn, slotsFor, toMinutes, type TakenFn } from '@/lib/data';
import { loadBookings, removeBooking, saveBooking, takenFor, type Booking } from '@/lib/bookings';
import Logo from './Logo';
import Select from './Select';

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false, loading: () => <div className="minimap" /> });

export default function ClinicView({ id }: { id: string }) {
  const c = getClinic(id)!;
  const [now, setNow] = useState<Date | null>(null);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(c.services[0].id);
  const [dentistId, setDentistId] = useState('any');
  const [day, setDay] = useState<string>('');
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  const [taken, setTaken] = useState<TakenFn | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [rescheduleId, setRescheduleId] = useState('');

  // free times on a day for a dentist: not booked yet, and not already in the past on the clinic's clock
  const freeOn = useCallback(
    (d: Date, dId: string, n: Date | null = now, tk: TakenFn | undefined = taken) => {
      if (!n) return [];
      const isToday = dayKey(d) === dayKey(n);
      return slotsFor(c, d, dId, tk).filter((t) => !isToday || toMinutes(t) > n.getHours() * 60 + n.getMinutes());
    },
    [c, now, taken],
  );

  useEffect(() => {
    const n = nowIn(c.city);
    const q = new URLSearchParams(window.location.search);
    // only reschedule a booking that really exists and belongs to this clinic; its own slot stays selectable
    const rid = q.get('reschedule');
    const old = rid ? loadBookings().find((b) => b.id === rid && b.clinicId === c.id) : undefined;
    setRescheduleId(old?.id ?? '');
    const tk = takenFor(c.id, undefined, old?.id);
    setNow(n);
    setTaken(() => tk);
    const s = q.get('service');
    if (s && c.services.some((x) => x.id === s)) setServiceId(s);
    const dn = q.get('dentist');
    const dentist = dn && c.dentists.some((x) => x.id === dn) ? dn : 'any';
    if (dentist !== 'any') {
      setDentistId(dentist);
      setStep(3);
    }
    const days14 = Array.from({ length: 14 }, (_, i) => addDays(n, i));
    const wantDay = q.get('day');
    const wantTime = q.get('time');
    // a prefilled slot (from a link) is only used when it is a real, still-free time within the booking window
    const valid =
      !!wantDay && !!wantTime && days14.some((d) => dayKey(d) === wantDay) && freeOn(new Date(wantDay + 'T12:00:00'), dentist, n, tk).includes(wantTime);
    if (valid) {
      setDay(wantDay!);
      setTime(wantTime!);
      setStep(3);
    } else {
      // land on the first day that still has free times instead of an empty "today"
      const first = days14.find((d) => freeOn(d, dentist, n, tk).length);
      setDay(dayKey(first ?? n));
      if (wantDay || wantTime) {
        setStep(3);
        setNotice('That time is no longer available — please pick another.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c]);

  const service = c.services.find((s) => s.id === serviceId)!;
  const dentist = c.dentists.find((d) => d.id === dentistId);

  const days = useMemo(() => (now ? Array.from({ length: 14 }, (_, i) => addDays(now, i)) : []), [now]);
  const slots = useMemo(() => (now && day ? freeOn(new Date(day + 'T12:00:00'), dentistId) : []), [freeOn, day, dentistId, now]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit US phone number';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const edit = (k: 'name' | 'email' | 'phone' | 'note', v: string) => {
    setForm({ ...form, [k]: v });
    if (errors[k]) {
      const rest = { ...errors };
      delete rest[k];
      setErrors(rest);
    }
  };

  const onDentist = (id: string) => {
    setDentistId(id);
    setTime('');
    setNotice('');
    setStep(3);
    // keep the date if that dentist works it, otherwise jump to their first free day
    if (now && !freeOn(new Date(day + 'T12:00:00'), id).length) {
      const first = days.find((d) => freeOn(d, id).length);
      if (first) setDay(dayKey(first));
    }
  };

  // someone may have booked this time in another tab since the page loaded; returns true (and says so) if it is gone
  const slotLost = (fresh: TakenFn) => {
    if (!fresh(day, time, dentistId)) return false;
    setTaken(() => fresh);
    setTime('');
    setPaying(false);
    setStep(3);
    setNotice('Sorry, that time was just booked. Please pick another.');
    return true;
  };

  const pay = () => {
    if (slotLost(takenFor(c.id, undefined, rescheduleId))) return;
    setPaying(true);
    setTimeout(() => {
      // check again right before saving: the "processing" delay leaves a window for another tab to book the slot
      const fresh = takenFor(c.id, undefined, rescheduleId);
      if (slotLost(fresh)) return;
      // "first available" -> assign a dentist who is actually free at that time
      const d = new Date(day + 'T12:00:00');
      const who =
        dentist ?? c.dentists.find((x) => slotsFor(c, d, x.id, fresh).includes(time)) ?? c.dentists.find((x) => !fresh(day, time, x.id)) ?? c.dentists[0];
      if (rescheduleId) removeBooking(rescheduleId); // moving a visit frees the old slot
      const b = saveBooking({ clinicId: c.id, dentistId: who.id, serviceId, day, time, name: form.name, email: form.email, phone: form.phone });
      setDone(b);
      setPaying(false);
      setStep(6);
    }, 900);
  };

  const ics = () => {
    // the visit happens on the clinic's wall clock, so convert it to a real UTC instant: every calendar then shows the right local time
    const start = clinicTimeToUtc(c.city, day, toMinutes(time));
    const end = new Date(start.getTime() + service.minutes * 6e4);
    const utc = (x: Date) => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const esc = (t: string) => t.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
    const stamp = utc(new Date());
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Brightsmile//Demo//EN',
      'BEGIN:VEVENT',
      `UID:${done?.id ?? `${c.id}-${day}-${toMinutes(time)}`}@brightsmile.demo`, // stable, so re-downloading updates the same event
      `DTSTAMP:${stamp}`,
      `DTSTART:${utc(start)}`,
      `DTEND:${utc(end)}`,
      `SUMMARY:${esc(`${service.name} at ${c.name}`)}`,
      `LOCATION:${esc(`${c.address}, ${CITIES[c.city].name}`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointment.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const dateLabel = day ? new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  return (
    <div className="clinic-page">
      <header className="topbar simple">
        <Logo />
        <Link href={`/search/?city=${c.city}`} className="muted-link">
          ← Back to results
        </Link>
      </header>

      <main className="clinic-wrap" id="main">
        {rescheduleId && (
          <p className="notice" role="status">
            You are rescheduling an existing visit — pick a new time and your old slot will be released.
          </p>
        )}
        <div className="gallery">
          <div style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }}>
            <span>
              {c.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #bae6fd, #f1f5f9)' }} />
          <div style={{ background: 'linear-gradient(135deg, #fde68a, #f1f5f9)' }} />
        </div>

        <div className="clinic-cols">
          <div className="clinic-main">
            <h1>{c.name}</h1>
            <p className="meta">
              ★ {c.rating.toFixed(1)} · {c.reviewCount} reviews · {c.address}, {CITIES[c.city].name}
            </p>
            <div className="tags">
              <span className="tag green">In-network: {c.insurance.join(', ')}</span>
              {c.newPatients && <span className="tag">Accepts new patients</span>}
              <span className="tag">{c.languages.join(' · ')}</span>
              {c.weekends && <span className="tag">Open Sat</span>}
            </div>

            <h2>Services & prices</h2>
            <div className="table">
              {c.services.map((s) => (
                <button
                  key={s.id}
                  className={`trow${s.id === serviceId ? ' on' : ''}`}
                  onClick={() => {
                    setServiceId(s.id);
                    setStep(Math.max(step, 2) > 5 ? 2 : Math.min(step, 2));
                  }}
                >
                  <span>{s.name}</span>
                  <em>{s.minutes} min</em>
                  <b>{s.price ? `$${s.price}` : 'Free'}</b>
                </button>
              ))}
            </div>

            <h2>Dentists</h2>
            <div className="dentists">
              {c.dentists.map((d) => (
                <Link key={d.id} href={`/clinic/${c.id}/dentist/${d.id}/`} className="dentist">
                  <i style={{ background: d.color }}>
                    {d.name
                      .replace('Dr. ', '')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </i>
                  <div>
                    <b>
                      {d.name}, {d.title}
                    </b>
                    <span>{d.specialty}</span>
                  </div>
                </Link>
              ))}
            </div>

            <h2>Location</h2>
            <MiniMap lng={c.lng} lat={c.lat} />

            <h2>Reviews</h2>
            {c.reviews.map((r) => (
              <div key={r.author} className="review">
                <b>
                  {'★'.repeat(r.rating)} {r.author} · {r.ago}
                </b>
                <p>{r.text}</p>
              </div>
            ))}
          </div>

          <aside className="booking">
            {step < 6 ? (
              <>
                <h3>Book an appointment</h3>
                <ol className="steps">
                  {['Service', 'Dentist', 'Time', 'Details', 'Pay'].map((s, i) => (
                    <li key={s} className={i + 1 < step ? 'done' : i + 1 === step ? 'cur' : ''} onClick={() => i + 1 < step && setStep(i + 1)}>
                      {i + 1} {s}
                    </li>
                  ))}
                </ol>

                <div className="field">
                  <span>Service</span>
                  <Select
                    ariaLabel="Service"
                    value={serviceId}
                    onChange={(v) => {
                      setServiceId(v);
                      if (step === 1) setStep(2);
                    }}
                    options={c.services.map((x) => ({ value: x.id, label: `${x.name} · ${x.minutes} min · ${x.price ? `$${x.price}` : 'Free'}` }))}
                  />
                </div>
                {step >= 2 && (
                  <div className="field">
                    <span>Dentist</span>
                    <Select
                      ariaLabel="Dentist"
                      value={dentistId}
                      onChange={onDentist}
                      options={[{ value: 'any', label: 'First available' }, ...c.dentists.map((d) => ({ value: d.id, label: `${d.name}, ${d.title}` }))]}
                    />
                  </div>
                )}
                {step === 1 && (
                  <button className="btn full" onClick={() => setStep(2)}>
                    Continue
                  </button>
                )}
                {step === 2 && (
                  <button className="btn full" onClick={() => setStep(3)}>
                    Continue
                  </button>
                )}

                {step >= 3 && step < 4 && (
                  <>
                    {notice && (
                      <p className="notice" role="alert">
                        {notice}
                      </p>
                    )}
                    <div className="month">
                      {days.length ? new Date(day + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
                    </div>
                    <div className="days">
                      {days.map((d) => {
                        const k = dayKey(d);
                        const closed = freeOn(d, dentistId).length === 0;
                        return (
                          <button
                            key={k}
                            disabled={closed}
                            className={k === day ? 'on' : ''}
                            onClick={() => {
                              setDay(k);
                              setTime('');
                              setNotice('');
                            }}
                          >
                            <span>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <b>{d.getDate()}</b>
                          </button>
                        );
                      })}
                    </div>
                    <div className="times">
                      {slots.length ? (
                        slots.map((t) => (
                          <button key={t} className={t === time ? 'on' : ''} onClick={() => setTime(t)}>
                            {t}
                          </button>
                        ))
                      ) : (
                        <p className="muted">No free slots this day — pick another date.</p>
                      )}
                    </div>
                    <button className="btn full" disabled={!time} onClick={() => setStep(4)}>
                      {time ? `Continue — ${dateLabel} at ${time}` : 'Choose a time'}
                    </button>
                  </>
                )}

                {step === 4 && (
                  <form
                    className="details"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (validate()) setStep(5);
                    }}
                  >
                    <p className="summary">
                      {service.name} · {dateLabel} at {time}
                      {dentist ? ` · ${dentist.name}` : ''}
                    </p>
                    {(['name', 'email', 'phone'] as const).map((k) => (
                      <label key={k} className="field">
                        <span>{k === 'name' ? 'Full name' : k === 'email' ? 'Email' : 'Mobile phone'}</span>
                        <input
                          value={form[k]}
                          type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                          placeholder={k === 'name' ? 'Jane Smith' : k === 'email' ? 'jane@example.com' : '(512) 555-0142'}
                          onChange={(e) => edit(k, e.target.value)}
                          aria-invalid={!!errors[k]}
                          autoComplete={k === 'name' ? 'name' : k === 'phone' ? 'tel' : 'email'}
                        />
                        {errors[k] && <small className="err">{errors[k]}</small>}
                      </label>
                    ))}
                    <label className="field">
                      <span>Note for the clinic (optional)</span>
                      <textarea rows={2} value={form.note} onChange={(e) => edit('note', e.target.value)} />
                    </label>
                    <button className="btn full" type="submit">
                      Continue to deposit
                    </button>
                  </form>
                )}

                {step === 5 && (
                  <div className="pay">
                    <div className="sum-row">
                      <span>{service.name}</span>
                      <b>{service.price ? `$${service.price}` : 'Free'}</b>
                    </div>
                    <div className="sum-row">
                      <span>
                        {dateLabel} at {time}
                      </span>
                      <span>{dentist ? dentist.name : 'First available'}</span>
                    </div>
                    <div className="sum-row total">
                      <span>Deposit due now</span>
                      <b>${DEPOSIT}.00</b>
                    </div>
                    <div className="card-demo">💳 Demo mode — no real payment is taken</div>
                    <button className="btn full" onClick={pay} disabled={paying}>
                      {paying ? 'Processing…' : `Pay $${DEPOSIT} deposit & book`}
                    </button>
                    <p className="fine">Refundable · Free cancellation up to 24 h before the visit</p>
                  </div>
                )}

                {step < 5 && <p className="fine">${DEPOSIT} refundable deposit · Free cancellation up to 24 h</p>}
              </>
            ) : (
              <div className="confirmed">
                <div className="check">✓</div>
                <h3>You&apos;re booked!</h3>
                <p>
                  {service.name} at <b>{c.name}</b>
                </p>
                <p className="big">
                  {dateLabel} · {time}
                </p>
                <p className="muted">Booking {done?.id} · demo: no email is actually sent</p>
                <button className="btn full" onClick={ics}>
                  Add to calendar (.ics)
                </button>
                {c.id === 'aus-01' && (
                  <Link className="btn ghost full" href="/admin/">
                    See it in the clinic admin →
                  </Link>
                )}
                <Link className="link" href={`/search/?city=${c.city}`}>
                  Back to search
                </Link>
                <Link className="link" href="/my-bookings/">
                  View my bookings
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
