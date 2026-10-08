'use client';
import Link from 'next/link';
import { dayKey, dayLabel, type Clinic, type Service } from '@/lib/data';

export type ClinicRow = Clinic & {
  svc?: Service;
  fromPrice: number;
  distance: number;
  nextLabel: string;
  soonest: number;
  slots: { day: Date; time: string }[];
};

type Props = {
  c: ClinicRow;
  now: Date | null;
  service: string;
  insurance: string;
  selected: boolean;
  hovered: boolean;
  saved: boolean;
  compared: boolean;
  compareFull: boolean;
  onHover: (id: string | null) => void;
  /** card body clicked: select the clinic and fly the map to it */
  onFocus: (id: string) => void;
  /** map icon clicked: same, and on phones switch to the map */
  onLocate: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleCompare: (id: string) => void;
};

export default function ClinicCard({
  c,
  now,
  service,
  insurance,
  selected,
  hovered,
  saved,
  compared,
  compareFull,
  onHover,
  onFocus,
  onLocate,
  onToggleSaved,
  onToggleCompare,
}: Props) {
  return (
    <article
      id={'card-' + c.id}
      className={`card-clinic${selected ? ' sel' : ''}${hovered ? ' hov' : ''}`}
      onMouseEnter={() => onHover(c.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('a, button')) onFocus(c.id);
      }}
    >
      <Link href={`/clinic/${c.id}/`} className="photo" style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }} aria-label={c.name}>
        <span className="photo-mark">
          {c.name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')}
        </span>
      </Link>
      <div className="info">
        <div className="row-between">
          <Link href={`/clinic/${c.id}/`} className="name">
            {c.name}
          </Link>
          <div className="card-actions">
            <button
              className={`heart${saved ? ' on' : ''}`}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from saved' : 'Save clinic'}
              onClick={() => onToggleSaved(c.id)}
            >
              {saved ? '♥' : '♡'}
            </button>
            <button className="locate" title="Show on map" aria-label={`Show ${c.name} on map`} onClick={() => onLocate(c.id)}>
              ◎
            </button>
          </div>
        </div>
        <p className="meta">
          ★ {c.rating.toFixed(1)} ({c.reviewCount}) · {c.distance.toFixed(1)} mi · {c.address}
        </p>
        <div className="tags">
          {insurance && c.insurance.includes(insurance) && <span className="tag green">In-network</span>}
          {c.newPatients && <span className="tag">New patients</span>}
          {c.languages.length > 1 && <span className="tag">{c.languages.slice(1).join(', ')}</span>}
          {c.weekends && <span className="tag">Sat</span>}
        </div>
        <div className="slots">
          {c.slots.length ? (
            c.slots.map((s) => (
              <Link
                key={s.day.toISOString() + s.time}
                href={`/clinic/${c.id}/?service=${service}&day=${dayKey(s.day)}&time=${encodeURIComponent(s.time)}`}
                className="slot"
              >
                {now && dayLabel(s.day, now)} {s.time}
              </Link>
            ))
          ) : (
            <span className="muted">No online slots this week</span>
          )}
        </div>
        <div className="row-between price-row">
          <p className="price">
            {c.svc?.name} <b>{c.fromPrice ? `$${c.fromPrice}` : 'Free'}</b>
          </p>
          <label className={`cmp${compared ? ' on' : ''}`} title={!compared && compareFull ? 'You can compare up to 3 clinics' : undefined}>
            <input type="checkbox" checked={compared} disabled={!compared && compareFull} onChange={() => onToggleCompare(c.id)} /> Compare
          </label>
        </div>
      </div>
    </article>
  );
}
