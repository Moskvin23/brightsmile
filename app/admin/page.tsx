'use client';
import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import { addDays, dayKey, getClinic, nowIn, SERVICES, SLOT_TIMES, toMinutes } from '@/lib/data';
import { appointmentsFor, type Appt } from '@/lib/appointments';
import { saveBooking, updateBooking } from '@/lib/bookings';

const CLINIC = 'aus-01';
const STATUS: Record<Appt['status'], { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 's-confirmed' },
  arrived: { label: 'Arrived', cls: 's-arrived' },
  pending: { label: 'Pending', cls: 's-pending' },
  noshow: { label: 'No-show', cls: 's-noshow' },
  online: { label: 'Booked online', cls: 's-online' },
};
const START = 8 * 60,
  END = 18 * 60,
  PX = 1.25; // px per minute
const fmt = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${m >= 720 ? 'PM' : 'AM'}`;
const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.name ?? id;
const at = (k: string) => new Date(k + 'T12:00');
type View = 'day' | 'week' | 'month';
const prettyPhone = (p: string) => {
  const d = p.replace(/\D/g, '').slice(-10);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

function mondayOf(k: string) {
  const d = at(k);
  return addDays(d, -((d.getDay() + 6) % 7));
}
function shift(k: string, view: View, dir: 1 | -1) {
  const d = at(k);
  if (view === 'day') return dayKey(addDays(d, dir));
  if (view === 'week') return dayKey(addDays(d, 7 * dir));
  const t = new Date(d.getFullYear(), d.getMonth() + dir, 1, 12);
  t.setDate(Math.min(d.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return dayKey(t);
}

export default function ClinicAdmin() {
  const c = getClinic(CLINIC)!;
  const [tab, setTab] = useState('calendar');
  const [view, setView] = useState<View>('day');
  const [now, setNow] = useState<Date | null>(null);
  const [day, setDay] = useState('');
  const [overrides, setOverrides] = useState<Record<string, Appt['status']>>({});
  const [open, setOpen] = useState<Appt | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState('');

  // the calendar runs on the clinic's wall clock (Austin), not the browser's
  useEffect(() => {
    const n = nowIn(c.city);
    setNow(n);
    setDay(dayKey(n));
  }, [c.city]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // `tick` forces a re-read of localStorage bookings after the admin changes one
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => (now ? appointmentsFor(CLINIC, addDays(now, -60), 150) : []), [now, tick]);
  const withStatus = useMemo(() => all.map((a) => ({ ...a, status: overrides[a.id] ?? a.status })), [all, overrides]);
  const today = withStatus.filter((a) => a.day === day);
  const todayKey = now ? dayKey(now) : '';

  const setStatus = (a: Appt, s: Appt['status']) => {
    setOverrides({ ...overrides, [a.id]: s });
    if (a.id.startsWith('BK-')) {
      updateBooking(a.id, { status: s });
      setTick(tick + 1);
    }
    setOpen({ ...a, status: s });
  };
  const goDay = (k: string) => {
    setDay(k);
    setView('day');
  };

  const items = [
    { key: 'calendar', label: 'Calendar', icon: '▦' },
    { key: 'dashboard', label: 'Dashboard', icon: '◔' },
    { key: 'patients', label: 'Patients', icon: '☺' },
    { key: 'hours', label: 'Dentists & hours', icon: '✚' },
    { key: 'services', label: 'Services & prices', icon: '$' },
    { key: 'reminders', label: 'Reminders', icon: '✉' },
    { key: 'settings', label: 'Settings', icon: '⚙' },
  ];

  const title = !day
    ? ''
    : view === 'day'
      ? at(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : view === 'week'
        ? `${mondayOf(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(mondayOf(day), 5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : at(day).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const inView = withStatus.filter((a) =>
    view === 'day'
      ? a.day === day
      : view === 'week'
        ? a.day >= dayKey(mondayOf(day)) && a.day <= dayKey(addDays(mondayOf(day), 6))
        : a.day.slice(0, 7) === day.slice(0, 7),
  );

  return (
    <AdminShell sub={c.name} items={items} active={tab} onNav={setTab} switchTo={{ href: '/admin/platform/', label: 'Switch to platform admin →' }}>
      {!now ? (
        <div className="admin-pad">Loading…</div>
      ) : tab === 'calendar' ? (
        <>
          <div className="admin-top">
            <div className="date-nav">
              <button aria-label="Previous" onClick={() => setDay(shift(day, view, -1))}>
                ‹
              </button>
              <button aria-label="Next" onClick={() => setDay(shift(day, view, 1))}>
                ›
              </button>
              <h1>{title}</h1>
              {(view !== 'day' || day !== todayKey) && (
                <button className="today" onClick={() => setDay(todayKey)}>
                  Today
                </button>
              )}
              <div className="seg view-seg">
                {(['day', 'week', 'month'] as View[]).map((v) => (
                  <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="day-stats">
              <span>
                <b>{inView.length}</b> booked
              </span>
              <span>
                <b>{inView.filter((a) => a.source === 'online').length}</b> online
              </span>
              <span>
                <b>{inView.filter((a) => a.status === 'noshow').length}</b> no-show
              </span>
              <button className="btn" onClick={() => setAdding(true)}>
                + New appointment
              </button>
            </div>
          </div>

          {view === 'day' && (
            <div className="cal-scroll">
              <div className="cal" style={{ gridTemplateColumns: `64px repeat(${c.dentists.length}, minmax(180px, 1fr))` }}>
                <div className="cal-head" />
                {c.dentists.map((d) => (
                  <div key={d.id} className="cal-head">
                    <i style={{ background: d.color }} />
                    {d.name}
                  </div>
                ))}
                <div className="cal-times" style={{ height: (END - START) * PX }}>
                  {Array.from({ length: (END - START) / 60 + 1 }, (_, h) => (
                    <span key={h} style={{ top: h * 60 * PX }}>
                      {fmt(START + h * 60).replace(':00', '')}
                    </span>
                  ))}
                </div>
                {c.dentists.map((d) => (
                  <div key={d.id} className="cal-col" style={{ height: (END - START) * PX }}>
                    {today
                      .filter((a) => a.dentistId === d.id)
                      .map((a) => (
                        <button
                          key={a.id}
                          className={`appt ${STATUS[a.status].cls}`}
                          style={{ top: (a.start - START) * PX + 2, height: a.minutes * PX - 4 }}
                          onClick={() => setOpen(a)}
                        >
                          <b>{a.patient}</b>
                          <span>
                            {svcName(a.serviceId)} · {fmt(a.start)}
                          </span>
                        </button>
                      ))}
                    {day === todayKey && now.getHours() * 60 + now.getMinutes() > START && now.getHours() * 60 + now.getMinutes() < END && (
                      <div className="now-line" style={{ top: (now.getHours() * 60 + now.getMinutes() - START) * PX }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className="cal-scroll">
              <div className="week">
                {Array.from({ length: 6 }, (_, i) => addDays(mondayOf(day), i)).map((d) => {
                  const k = dayKey(d);
                  const list = withStatus.filter((a) => a.day === k).sort((a, b) => a.start - b.start);
                  return (
                    <div key={k} className={`week-col${k === todayKey ? ' today' : ''}`}>
                      <button className="week-head" onClick={() => goDay(k)}>
                        {d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                        <small>{list.length}</small>
                      </button>
                      {list.map((a) => (
                        <button key={a.id} className={`wchip ${STATUS[a.status].cls}`} onClick={() => setOpen(a)}>
                          <b>
                            {fmt(a.start)} · {a.patient}
                          </b>
                          <span>{svcName(a.serviceId)}</span>
                        </button>
                      ))}
                      {!list.length && (
                        <p className="muted" style={{ fontSize: 13 }}>
                          No appointments
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'month' && (
            <div className="cal-scroll">
              <div className="month-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
                  <div key={w} className="month-dow">
                    {w}
                  </div>
                ))}
                {(() => {
                  const first = new Date(at(day).getFullYear(), at(day).getMonth(), 1, 12);
                  const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
                  const lead = (first.getDay() + 6) % 7;
                  return [
                    ...Array.from({ length: lead }, (_, i) => <div key={'b' + i} className="mcell blank" />),
                    ...Array.from({ length: n }, (_, i) => {
                      const d = addDays(first, i);
                      const k = dayKey(d);
                      const list = withStatus.filter((a) => a.day === k);
                      return (
                        <button key={k} className={`mcell${k === todayKey ? ' today' : ''}`} onClick={() => goDay(k)} disabled={d.getDay() === 0}>
                          <b>{i + 1}</b>
                          {list.length > 0 && (
                            <>
                              <em>{list.length} booked</em>
                              <small>{list.filter((a) => a.source === 'online').length} online</small>
                            </>
                          )}
                        </button>
                      );
                    }),
                  ];
                })()}
              </div>
            </div>
          )}

          {open && (
            <div className="drawer-scrim" onClick={() => setOpen(null)}>
              <div className="drawer" onClick={(e) => e.stopPropagation()}>
                <button className="x" onClick={() => setOpen(null)}>
                  ✕
                </button>
                <h3>{open.patient}</h3>
                <p className="muted">
                  {svcName(open.serviceId)} · {fmt(open.start)} · {c.dentists.find((d) => d.id === open.dentistId)?.name}
                </p>
                <p>📞 {open.phone}</p>
                <p>
                  Source: {open.source === 'online' ? 'Booked online' : 'Phone'} · Price ${open.price}
                </p>
                <h4>Status</h4>
                <div className="status-btns">
                  {(['confirmed', 'arrived', 'noshow', 'pending'] as const).map((s) => (
                    <button key={s} className={`${STATUS[s].cls}${open.status === s ? ' on' : ''}`} onClick={() => setStatus(open, s)}>
                      {STATUS[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {adding && (
            <NewAppointment
              defaultDay={day || todayKey}
              appts={withStatus}
              onClose={() => setAdding(false)}
              onSaved={(k) => {
                setAdding(false);
                setTick(tick + 1);
                setDay(k);
                setView('day');
                setToast('Appointment added');
              }}
            />
          )}
        </>
      ) : tab === 'dashboard' ? (
        <Dashboard appts={withStatus} now={now} />
      ) : tab === 'patients' ? (
        <div className="admin-pad">
          <div className="admin-top">
            <h1>Patients</h1>
            <input className="search-in" placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Patients appts={withStatus} q={q} />
        </div>
      ) : tab === 'services' ? (
        <Services appts={withStatus} now={now} />
      ) : tab === 'reminders' ? (
        <Reminders />
      ) : tab === 'settings' ? (
        <Settings />
      ) : (
        <div className="admin-pad">
          <h1>Dentists & hours</h1>
          <div className="hours-grid">
            {c.dentists.map((d) => (
              <div key={d.id} className="kpi">
                <b>
                  {d.name}, {d.title}
                </b>
                <span>{d.specialty}</span>
                <p>Mon–Fri 8:00 AM – 5:00 PM{c.weekends ? ' · Sat 8:00 AM – 12:00 PM' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </AdminShell>
  );
}

function NewAppointment({ defaultDay, appts, onClose, onSaved }: { defaultDay: string; appts: Appt[]; onClose: () => void; onSaved: (day: string) => void }) {
  const c = getClinic(CLINIC)!;
  const n = nowIn(c.city);
  const today = dayKey(n);
  const nowMin = n.getHours() * 60 + n.getMinutes();
  const [f, setF] = useState({ name: '', phone: '', serviceId: 'cleaning', dentistId: c.dentists[0].id, day: defaultDay, time: '9:00 AM' });
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const svc = c.services.find((s) => s.id === f.serviceId)!;
    const start = toMinutes(f.time);
    const len = Math.min(svc.minutes, 45);
    if (f.name.trim().length < 2) return setErr('Enter the patient’s name');
    if (f.phone.replace(/\D/g, '').length < 10) return setErr('Enter a 10-digit phone number');
    if (!f.day) return setErr('Pick a date');
    const dow = at(f.day).getDay();
    if (dow === 0) return setErr('The clinic is closed on Sundays');
    if (dow === 6 && !c.weekends) return setErr('The clinic is closed on Saturdays');
    if (dow === 6 && start >= 12 * 60) return setErr('On Saturdays the clinic works until 12:00 PM');
    if (f.day < today || (f.day === today && start <= nowMin)) return setErr('Pick a time in the future');
    const clash = appts.find(
      (a) => a.dentistId === f.dentistId && a.day === f.day && a.status !== 'noshow' && start < a.start + a.minutes && a.start < start + len,
    );
    if (clash) return setErr(`${c.dentists.find((d) => d.id === f.dentistId)!.name} already has ${clash.patient} at ${fmt(clash.start)}`);
    saveBooking({
      clinicId: c.id,
      dentistId: f.dentistId,
      serviceId: f.serviceId,
      day: f.day,
      time: f.time,
      name: f.name.trim(),
      email: '',
      phone: prettyPhone(f.phone),
      source: 'phone',
      status: 'confirmed',
    });
    onSaved(f.day);
  };
  return (
    <Modal title="New appointment" onClose={onClose}>
      <form className="modal-form" noValidate onSubmit={submit}>
        <h3>New appointment</h3>
        <label className="field">
          <span>Patient name</span>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Jane Smith" autoFocus />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={f.phone} type="tel" onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="(512) 555-0142" />
        </label>
        <div className="field">
          <span>Service</span>
          <Select
            ariaLabel="Service"
            value={f.serviceId}
            onChange={(v) => setF({ ...f, serviceId: v })}
            options={c.services.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
        <div className="field">
          <span>Dentist</span>
          <Select
            ariaLabel="Dentist"
            value={f.dentistId}
            onChange={(v) => setF({ ...f, dentistId: v })}
            options={c.dentists.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
        <label className="field">
          <span>Date</span>
          <input type="date" min={today} value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} />
        </label>
        <div className="field">
          <span>Time</span>
          <Select ariaLabel="Time" value={f.time} onChange={(v) => setF({ ...f, time: v })} options={SLOT_TIMES.map((t) => ({ value: t, label: t }))} />
        </div>
        {err && (
          <small className="err" role="alert">
            {err}
          </small>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            Add appointment
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Services({ appts, now }: { appts: Appt[]; now: Date }) {
  const c = getClinic(CLINIC)!;
  const from = dayKey(addDays(now, -30)),
    to = dayKey(now);
  const recent = appts.filter((a) => a.day >= from && a.day <= to);
  return (
    <div className="admin-pad">
      <h1>Services & prices</h1>
      <div className="dtable">
        <div className="dt-row dt-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1.2fr' }}>
          <span>Service</span>
          <span>Duration</span>
          <span>Price</span>
          <span>Booked (30 days)</span>
        </div>
        {c.services.map((s) => (
          <div key={s.id} className="dt-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1.2fr' }}>
            <b>{s.name}</b>
            <span>{s.minutes} min</span>
            <span>{s.price ? `$${s.price}` : 'Free'}</span>
            <span>{recent.filter((a) => a.serviceId === s.id).length}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function useSetting(key: string, initial: boolean) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    try {
      const s = localStorage.getItem('brightsmile.' + key);
      if (s !== null) setV(s === '1');
    } catch {
      /* ignore */
    }
  }, [key]);
  return [
    v,
    (n: boolean) => {
      setV(n);
      try {
        localStorage.setItem('brightsmile.' + key, n ? '1' : '0');
      } catch {
        /* ignore */
      }
    },
  ] as const;
}

function Toggle({ id, title, text, initial }: { id: string; title: string; text: string; initial: boolean }) {
  const [on, set] = useSetting(id, initial);
  return (
    <div className="toggle-row">
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
      <button className={`switch${on ? ' on' : ''}`} role="switch" aria-checked={on} aria-label={title} onClick={() => set(!on)} />
    </div>
  );
}

function Reminders() {
  return (
    <div className="admin-pad">
      <h1>Reminders</h1>
      <div className="stack">
        <Toggle id="rem-confirm" title="Confirmation email" text="Sent right after a patient books online." initial />
        <Toggle id="rem-24h" title="Email reminder · 24 hours before" text="Includes a link to reschedule or cancel for free." initial />
        <Toggle id="rem-sms" title="SMS reminder · 2 hours before" text="Short text with address and arrival instructions." initial={false} />
        <Toggle id="rem-recall" title="6-month recall" text="Invites patients back for their next check-up." initial={false} />
        <p className="muted" style={{ fontSize: 13 }}>
          Demo: settings are saved in this browser; no messages are actually sent.
        </p>
      </div>
    </div>
  );
}

function Settings() {
  const c = getClinic(CLINIC)!;
  return (
    <div className="admin-pad">
      <h1>Settings</h1>
      <div className="stack">
        <label className="field">
          <span>Clinic name</span>
          <input defaultValue={c.name} readOnly />
        </label>
        <label className="field">
          <span>Address</span>
          <input defaultValue={`${c.address}, Austin, TX`} readOnly />
        </label>
        <label className="field">
          <span>Accepted insurance</span>
          <input defaultValue={c.insurance.join(', ')} readOnly />
        </label>
        <label className="field">
          <span>Languages</span>
          <input defaultValue={c.languages.join(', ')} readOnly />
        </label>
        <Toggle id="set-new" title="Accepting new patients" text="Shown as a badge on your search listing." initial={c.newPatients} />
        <Toggle id="set-sat" title="Open on Saturdays" text="Adds Saturday morning slots to online booking." initial={c.weekends} />
        <p className="muted" style={{ fontSize: 13 }}>
          Demo: profile fields are read-only.
        </p>
      </div>
    </div>
  );
}

function Dashboard({ appts, now }: { appts: Appt[]; now: Date }) {
  const last = Array.from({ length: 14 }, (_, i) => dayKey(addDays(now, i - 13)));
  const past = appts.filter((a) => a.day >= last[0] && a.day <= last[13]);
  const perDay = last.map((d) => ({ d, n: past.filter((a) => a.day === d).length, online: past.filter((a) => a.day === d && a.source === 'online').length }));
  const max = Math.max(...perDay.map((p) => p.n), 1);
  const revenue = past.filter((a) => a.status !== 'noshow').reduce((s, a) => s + a.price, 0);
  const noshow = past.filter((a) => a.status === 'noshow').length / Math.max(past.length, 1);
  const bySvc = SERVICES.map((s) => ({ s: s.name, n: past.filter((a) => a.serviceId === s.id).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n);
  const sMax = Math.max(...bySvc.map((x) => x.n), 1);
  return (
    <div className="admin-pad">
      <h1>
        Dashboard <small>last 14 days</small>
      </h1>
      <div className="kpis">
        <div className="kpi">
          <span>Appointments</span>
          <b>{past.length}</b>
        </div>
        <div className="kpi">
          <span>Booked online</span>
          <b>{Math.round((past.filter((a) => a.source === 'online').length / Math.max(past.length, 1)) * 100)}%</b>
        </div>
        <div className="kpi">
          <span>Revenue</span>
          <b>${revenue.toLocaleString('en-US')}</b>
        </div>
        <div className="kpi">
          <span>No-show rate</span>
          <b>{(noshow * 100).toFixed(1)}%</b>
        </div>
      </div>
      <div className="panels">
        <div className="panel">
          <h3>Appointments per day</h3>
          <div className="bars">
            {perDay.map((p) => (
              <div key={p.d} className="bar" title={`${p.d}: ${p.n} (${p.online} online)`}>
                <div className="b-total" style={{ height: `${(p.n / max) * 100}%` }}>
                  <div className="b-online" style={{ height: `${(p.online / Math.max(p.n, 1)) * 100}%` }} />
                </div>
                <span>{new Date(p.d + 'T12:00').getDate()}</span>
              </div>
            ))}
          </div>
          <p className="legend">
            <i className="lg-total" /> Total <i className="lg-online" /> Online
          </p>
        </div>
        <div className="panel">
          <h3>By service</h3>
          {bySvc.map((x) => (
            <div key={x.s} className="hbar">
              <span>{x.s}</span>
              <div>
                <i style={{ width: `${(x.n / sMax) * 100}%` }} />
              </div>
              <b>{x.n}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Patients({ appts, q }: { appts: Appt[]; q: string }) {
  const map = new Map<string, { name: string; phone: string; visits: number; last: string; spent: number; online: boolean }>();
  for (const a of appts) {
    const p = map.get(a.patient) ?? { name: a.patient, phone: a.phone, visits: 0, last: '', spent: 0, online: false };
    p.visits++;
    p.last = a.day > p.last ? a.day : p.last;
    p.spent += a.status === 'noshow' ? 0 : a.price;
    p.online ||= a.source === 'online';
    map.set(a.patient, p);
  }
  const rows = [...map.values()].filter((p) => (p.name + p.phone).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.last.localeCompare(a.last));
  return (
    <div className="dtable">
      <div className="dt-row dt-head p-cols">
        <span>Patient</span>
        <span>Phone</span>
        <span>Visits</span>
        <span>Last visit</span>
        <span>Total</span>
      </div>
      {rows.map((p) => (
        <div key={p.name} className="dt-row p-cols">
          <b>
            {p.name}
            {p.online && <em className="badge s-online">online</em>}
          </b>
          <span>{p.phone}</span>
          <span>{p.visits}</span>
          <span>{new Date(p.last + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span>${p.spent.toLocaleString('en-US')}</span>
        </div>
      ))}
    </div>
  );
}
