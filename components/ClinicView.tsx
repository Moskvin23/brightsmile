'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { addDays, CITIES, dayKey, DEPOSIT, getClinic, slotsFor, toMinutes } from '@/lib/data';
import { saveBooking, type Booking } from '@/lib/bookings';
import Logo from './Logo';

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

  useEffect(() => {
    const n = new Date();
    setNow(n);
    const q = new URLSearchParams(window.location.search);
    const s = q.get('service');
    if (s && c.services.some((x) => x.id === s)) setServiceId(s);
    if (q.get('day') && q.get('time')) { setDay(q.get('day')!); setTime(q.get('time')!); setStep(3); }
    else setDay(dayKey(n));
  }, [c]);

  const service = c.services.find((s) => s.id === serviceId)!;
  const dentist = c.dentists.find((d) => d.id === dentistId);

  const days = useMemo(() => (now ? Array.from({ length: 14 }, (_, i) => addDays(now, i)) : []), [now]);
  const slots = useMemo(() => {
    if (!now || !day) return [];
    const d = new Date(day + 'T12:00:00');
    return slotsFor(c, d, dentistId).filter((t) => day !== dayKey(now) || toMinutes(t) > now.getHours() * 60 + now.getMinutes());
  }, [c, day, dentistId, now]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit US phone number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const b = saveBooking({ clinicId: c.id, dentistId: dentist ? dentist.id : c.dentists[0].id, serviceId, day, time, name: form.name, email: form.email, phone: form.phone });
      setDone(b); setPaying(false); setStep(6);
    }, 900);
  };

  const ics = () => {
    const d = new Date(day + 'T00:00:00'); const m = toMinutes(time);
    d.setHours(Math.floor(m / 60), m % 60);
    const end = new Date(d.getTime() + service.minutes * 6e4);
    const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const body = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${f(d)}\nDTEND:${f(end)}\nSUMMARY:${service.name} at ${c.name}\nLOCATION:${c.address}, ${CITIES[c.city].name}\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = 'appointment.ics'; a.click();
  };

  const dateLabel = day ? new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  return (
    <div className="clinic-page">
      <header className="topbar simple">
        <Logo />
        <Link href={`/?city=${c.city}`} className="muted-link">← Back to results</Link>
      </header>

      <main className="clinic-wrap">
        <div className="gallery">
          <div style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }}><span>{c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span></div>
          <div style={{ background: 'linear-gradient(135deg, #bae6fd, #f1f5f9)' }} />
          <div style={{ background: 'linear-gradient(135deg, #fde68a, #f1f5f9)' }} />
        </div>

        <div className="clinic-cols">
          <div className="clinic-main">
            <h1>{c.name}</h1>
            <p className="meta">★ {c.rating.toFixed(1)} · {c.reviewCount} reviews · {c.address}, {CITIES[c.city].name}</p>
            <div className="tags">
              <span className="tag green">In-network: {c.insurance.join(', ')}</span>
              {c.newPatients && <span className="tag">Accepts new patients</span>}
              <span className="tag">{c.languages.join(' · ')}</span>
              {c.weekends && <span className="tag">Open Sat</span>}
            </div>

            <h2>Services & prices</h2>
            <div className="table">
              {c.services.map((s) => (
                <button key={s.id} className={`trow${s.id === serviceId ? ' on' : ''}`} onClick={() => { setServiceId(s.id); setStep(Math.max(step, 2) > 5 ? 2 : Math.min(step, 2)); }}>
                  <span>{s.name}</span><em>{s.minutes} min</em><b>{s.price ? `$${s.price}` : 'Free'}</b>
                </button>
              ))}
            </div>

            <h2>Dentists</h2>
            <div className="dentists">
              {c.dentists.map((d) => (
                <div key={d.id} className="dentist"><i style={{ background: d.color }}>{d.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('')}</i><div><b>{d.name}, {d.title}</b><span>{d.specialty}</span></div></div>
              ))}
            </div>

            <h2>Location</h2>
            <MiniMap lng={c.lng} lat={c.lat} />

            <h2>Reviews</h2>
            {c.reviews.map((r) => (
              <div key={r.author} className="review"><b>{'★'.repeat(r.rating)} {r.author} · {r.ago}</b><p>{r.text}</p></div>
            ))}
          </div>

          <aside className="booking">
            {step < 6 ? (
              <>
                <h3>Book an appointment</h3>
                <ol className="steps">
                  {['Service', 'Dentist', 'Time', 'Details', 'Pay'].map((s, i) => (
                    <li key={s} className={i + 1 < step ? 'done' : i + 1 === step ? 'cur' : ''} onClick={() => i + 1 < step && setStep(i + 1)}>{i + 1} {s}</li>
                  ))}
                </ol>

                <label className="field"><span>Service</span>
                  <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); if (step === 1) setStep(2); }}>
                    {c.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.minutes} min · {s.price ? `$${s.price}` : 'Free'}</option>)}
                  </select>
                </label>
                {step >= 2 && (
                  <label className="field"><span>Dentist</span>
                    <select value={dentistId} onChange={(e) => { setDentistId(e.target.value); setTime(''); setStep(3); }}>
                      <option value="any">First available</option>
                      {c.dentists.map((d) => <option key={d.id} value={d.id}>{d.name}, {d.title}</option>)}
                    </select>
                  </label>
                )}
                {step === 1 && <button className="btn full" onClick={() => setStep(2)}>Continue</button>}
                {step === 2 && <button className="btn full" onClick={() => setStep(3)}>Continue</button>}

                {step >= 3 && step < 4 && (
                  <>
                    <div className="days">
                      {days.map((d) => {
                        const k = dayKey(d); const closed = slotsFor(c, d, dentistId).length === 0;
                        return (
                          <button key={k} disabled={closed} className={k === day ? 'on' : ''} onClick={() => { setDay(k); setTime(''); }}>
                            <span>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span><b>{d.getDate()}</b>
                          </button>
                        );
                      })}
                    </div>
                    <div className="times">
                      {slots.length ? slots.map((t) => <button key={t} className={t === time ? 'on' : ''} onClick={() => setTime(t)}>{t}</button>) : <p className="muted">No free slots this day — pick another date.</p>}
                    </div>
                    <button className="btn full" disabled={!time} onClick={() => setStep(4)}>{time ? `Continue — ${dateLabel} at ${time}` : 'Choose a time'}</button>
                  </>
                )}

                {step === 4 && (
                  <form className="details" onSubmit={(e) => { e.preventDefault(); if (validate()) setStep(5); }}>
                    <p className="summary">{service.name} · {dateLabel} at {time}{dentist ? ` · ${dentist.name}` : ''}</p>
                    {(['name', 'email', 'phone'] as const).map((k) => (
                      <label key={k} className="field"><span>{k === 'name' ? 'Full name' : k === 'email' ? 'Email' : 'Mobile phone'}</span>
                        <input value={form[k]} type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'} placeholder={k === 'name' ? 'Jane Smith' : k === 'email' ? 'jane@example.com' : '(512) 555-0142'}
                          onChange={(e) => setForm({ ...form, [k]: e.target.value })} aria-invalid={!!errors[k]} />
                        {errors[k] && <small className="err">{errors[k]}</small>}
                      </label>
                    ))}
                    <label className="field"><span>Note for the clinic (optional)</span><textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
                    <button className="btn full" type="submit">Continue to deposit</button>
                  </form>
                )}

                {step === 5 && (
                  <div className="pay">
                    <div className="sum-row"><span>{service.name}</span><b>{service.price ? `$${service.price}` : 'Free'}</b></div>
                    <div className="sum-row"><span>{dateLabel} at {time}</span><span>{dentist ? dentist.name : 'First available'}</span></div>
                    <div className="sum-row total"><span>Deposit due now</span><b>${DEPOSIT}.00</b></div>
                    <div className="card-demo">💳 Demo mode — no real payment is taken</div>
                    <button className="btn full" onClick={pay} disabled={paying}>{paying ? 'Processing…' : `Pay $${DEPOSIT} deposit & book`}</button>
                    <p className="fine">Refundable · Free cancellation up to 24 h before the visit</p>
                  </div>
                )}

                {step < 5 && <p className="fine">${DEPOSIT} refundable deposit · Free cancellation up to 24 h</p>}
              </>
            ) : (
              <div className="confirmed">
                <div className="check">✓</div>
                <h3>You&apos;re booked!</h3>
                <p>{service.name} at <b>{c.name}</b></p>
                <p className="big">{dateLabel} · {time}</p>
                <p className="muted">Booking {done?.id} · demo: no email is actually sent</p>
                <button className="btn full" onClick={ics}>Add to calendar (.ics)</button>
                {c.id === 'aus-01' && <Link className="btn ghost full" href="/admin/">See it in the clinic admin →</Link>}
                <Link className="link" href={`/?city=${c.city}`}>Back to search</Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
