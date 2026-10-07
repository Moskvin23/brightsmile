'use client';
import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { addDays, dayKey, getClinic, SERVICES } from '@/lib/data';
import { appointmentsFor, type Appt } from '@/lib/appointments';
import { updateBooking } from '@/lib/bookings';

const CLINIC = 'aus-01';
const STATUS: Record<Appt['status'], { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 's-confirmed' },
  arrived: { label: 'Arrived', cls: 's-arrived' },
  pending: { label: 'Pending', cls: 's-pending' },
  noshow: { label: 'No-show', cls: 's-noshow' },
  online: { label: 'Booked online', cls: 's-online' },
};
const START = 8 * 60, END = 18 * 60, PX = 1.25; // px per minute
const fmt = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${m >= 720 ? 'PM' : 'AM'}`;
const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.name ?? id;

export default function ClinicAdmin() {
  const c = getClinic(CLINIC)!;
  const [tab, setTab] = useState('calendar');
  const [now, setNow] = useState<Date | null>(null);
  const [day, setDay] = useState('');
  const [overrides, setOverrides] = useState<Record<string, Appt['status']>>({});
  const [open, setOpen] = useState<Appt | null>(null);
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => { const n = new Date(); setNow(n); setDay(dayKey(n)); }, []);

  const all = useMemo(() => (now ? appointmentsFor(CLINIC, addDays(now, -21), 35) : []), [now, tick]);
  const withStatus = all.map((a) => ({ ...a, status: overrides[a.id] ?? a.status }));
  const today = withStatus.filter((a) => a.day === day);

  const setStatus = (a: Appt, s: Appt['status']) => {
    setOverrides({ ...overrides, [a.id]: s });
    if (a.id.startsWith('BK-')) { updateBooking(a.id, { status: s }); setTick(tick + 1); }
    setOpen({ ...a, status: s });
  };

  const items = [
    { key: 'calendar', label: 'Calendar', icon: '▦' },
    { key: 'dashboard', label: 'Dashboard', icon: '◔' },
    { key: 'patients', label: 'Patients', icon: '☺' },
    { key: 'hours', label: 'Dentists & hours', icon: '✚' },
  ];

  return (
    <AdminShell sub={c.name} items={items} active={tab} onNav={setTab} switchTo={{ href: '/admin/platform/', label: 'Switch to platform admin →' }}>
      {!now ? <div className="admin-pad">Loading…</div> : tab === 'calendar' ? (
        <>
          <div className="admin-top">
            <div className="date-nav">
              <button onClick={() => setDay(dayKey(addDays(new Date(day + 'T12:00'), -1)))}>‹</button>
              <button onClick={() => setDay(dayKey(addDays(new Date(day + 'T12:00'), 1)))}>›</button>
              <h1>{new Date(day + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
              {day !== dayKey(now) && <button className="today" onClick={() => setDay(dayKey(now))}>Today</button>}
            </div>
            <div className="day-stats">
              <span><b>{today.length}</b> booked</span>
              <span><b>{today.filter((a) => a.source === 'online').length}</b> online</span>
              <span><b>{today.filter((a) => a.status === 'noshow').length}</b> no-show</span>
            </div>
          </div>
          <div className="cal-scroll">
            <div className="cal" style={{ gridTemplateColumns: `64px repeat(${c.dentists.length}, minmax(180px, 1fr))` }}>
              <div className="cal-head" />
              {c.dentists.map((d) => <div key={d.id} className="cal-head"><i style={{ background: d.color }} />{d.name}</div>)}
              <div className="cal-times" style={{ height: (END - START) * PX }}>
                {Array.from({ length: (END - START) / 60 + 1 }, (_, h) => <span key={h} style={{ top: h * 60 * PX }}>{fmt(START + h * 60).replace(':00', '')}</span>)}
              </div>
              {c.dentists.map((d) => (
                <div key={d.id} className="cal-col" style={{ height: (END - START) * PX }}>
                  {today.filter((a) => a.dentistId === d.id).map((a) => (
                    <button key={a.id} className={`appt ${STATUS[a.status].cls}`} style={{ top: (a.start - START) * PX + 2, height: a.minutes * PX - 4 }} onClick={() => setOpen(a)}>
                      <b>{a.patient}</b><span>{svcName(a.serviceId)} · {fmt(a.start)}</span>
                    </button>
                  ))}
                  {day === dayKey(now) && now.getHours() * 60 + now.getMinutes() > START && now.getHours() * 60 + now.getMinutes() < END && (
                    <div className="now-line" style={{ top: (now.getHours() * 60 + now.getMinutes() - START) * PX }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          {open && (
            <div className="drawer-scrim" onClick={() => setOpen(null)}>
              <div className="drawer" onClick={(e) => e.stopPropagation()}>
                <button className="x" onClick={() => setOpen(null)}>✕</button>
                <h3>{open.patient}</h3>
                <p className="muted">{svcName(open.serviceId)} · {fmt(open.start)} · {c.dentists.find((d) => d.id === open.dentistId)?.name}</p>
                <p>📞 {open.phone}</p>
                <p>Source: {open.source === 'online' ? 'Booked online' : 'Phone'} · Price ${open.price}</p>
                <h4>Status</h4>
                <div className="status-btns">
                  {(['confirmed', 'arrived', 'noshow', 'pending'] as const).map((s) => (
                    <button key={s} className={`${STATUS[s].cls}${open.status === s ? ' on' : ''}`} onClick={() => setStatus(open, s)}>{STATUS[s].label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : tab === 'dashboard' ? (
        <Dashboard appts={withStatus} now={now} />
      ) : tab === 'patients' ? (
        <div className="admin-pad">
          <div className="admin-top"><h1>Patients</h1><input className="search-in" placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Patients appts={withStatus} q={q} />
        </div>
      ) : (
        <div className="admin-pad">
          <h1>Dentists & hours</h1>
          <div className="hours-grid">
            {c.dentists.map((d) => (
              <div key={d.id} className="kpi"><b>{d.name}, {d.title}</b><span>{d.specialty}</span><p>Mon–Fri 8:00 AM – 5:00 PM{c.weekends ? ' · Sat 8:00 AM – 12:00 PM' : ''}</p></div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Dashboard({ appts, now }: { appts: Appt[]; now: Date }) {
  const last = Array.from({ length: 14 }, (_, i) => dayKey(addDays(now, i - 13)));
  const past = appts.filter((a) => a.day >= last[0] && a.day <= last[13]);
  const perDay = last.map((d) => ({ d, n: past.filter((a) => a.day === d).length, online: past.filter((a) => a.day === d && a.source === 'online').length }));
  const max = Math.max(...perDay.map((p) => p.n), 1);
  const revenue = past.filter((a) => a.status !== 'noshow').reduce((s, a) => s + a.price, 0);
  const noshow = past.filter((a) => a.status === 'noshow').length / Math.max(past.length, 1);
  const bySvc = SERVICES.map((s) => ({ s: s.name, n: past.filter((a) => a.serviceId === s.id).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const sMax = Math.max(...bySvc.map((x) => x.n), 1);
  return (
    <div className="admin-pad">
      <h1>Dashboard <small>last 14 days</small></h1>
      <div className="kpis">
        <div className="kpi"><span>Appointments</span><b>{past.length}</b></div>
        <div className="kpi"><span>Booked online</span><b>{Math.round((past.filter((a) => a.source === 'online').length / Math.max(past.length, 1)) * 100)}%</b></div>
        <div className="kpi"><span>Revenue</span><b>${revenue.toLocaleString('en-US')}</b></div>
        <div className="kpi"><span>No-show rate</span><b>{(noshow * 100).toFixed(1)}%</b></div>
      </div>
      <div className="panels">
        <div className="panel">
          <h3>Appointments per day</h3>
          <div className="bars">
            {perDay.map((p) => (
              <div key={p.d} className="bar" title={`${p.d}: ${p.n} (${p.online} online)`}>
                <div className="b-total" style={{ height: `${(p.n / max) * 100}%` }}><div className="b-online" style={{ height: `${(p.online / Math.max(p.n, 1)) * 100}%` }} /></div>
                <span>{new Date(p.d + 'T12:00').getDate()}</span>
              </div>
            ))}
          </div>
          <p className="legend"><i className="lg-total" /> Total <i className="lg-online" /> Online</p>
        </div>
        <div className="panel">
          <h3>By service</h3>
          {bySvc.map((x) => (
            <div key={x.s} className="hbar"><span>{x.s}</span><div><i style={{ width: `${(x.n / sMax) * 100}%` }} /></div><b>{x.n}</b></div>
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
    p.visits++; p.last = a.day > p.last ? a.day : p.last; p.spent += a.status === 'noshow' ? 0 : a.price; p.online ||= a.source === 'online';
    map.set(a.patient, p);
  }
  const rows = [...map.values()].filter((p) => (p.name + p.phone).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.last.localeCompare(a.last));
  return (
    <div className="dtable">
      <div className="dt-row dt-head p-cols"><span>Patient</span><span>Phone</span><span>Visits</span><span>Last visit</span><span>Total</span></div>
      {rows.map((p) => (
        <div key={p.name} className="dt-row p-cols"><b>{p.name}{p.online && <em className="badge s-online">online</em>}</b><span>{p.phone}</span><span>{p.visits}</span><span>{new Date(p.last + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span>${p.spent.toLocaleString('en-US')}</span></div>
      ))}
    </div>
  );
}
