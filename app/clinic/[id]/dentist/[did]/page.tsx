import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { CITIES, clinics, getClinic } from '@/lib/data';

type Params = { id: string; did: string };

export function generateStaticParams() {
  return clinics.flatMap((c) => c.dentists.map((d) => ({ id: c.id, did: d.id })));
}

function find({ id, did }: Params) {
  const c = getClinic(id);
  const d = c?.dentists.find((x) => x.id === did);
  return c && d ? { c, d } : null;
}

// Deterministic "years of experience" so the page looks the same on every build.
const years = (id: string) => 6 + ([...id].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 17);

const FOCUS: Record<string, string> = {
  'General dentistry': 'check-ups, cleanings, fillings and preventive care for the whole family',
  Orthodontics: 'braces, clear aligners and bite correction for teens and adults',
  Cosmetic: 'whitening, veneers and smile design',
  Pediatric: 'gentle, friendly care for children from their first tooth',
  Endodontics: 'root canal treatment and saving damaged teeth',
  Periodontics: 'gum health, deep cleanings and implant care',
  Hygienist: 'professional cleanings, scaling and oral-health coaching',
};

export function generateMetadata({ params }: { params: Params }): Metadata {
  const f = find(params);
  if (!f) return { title: 'Dentist not found' };
  return {
    title: `${f.d.name}, ${f.d.title} — ${f.d.specialty} at ${f.c.name}`,
    description: `Book ${f.d.name}, ${f.d.specialty.toLowerCase()} in ${CITIES[f.c.city].name}. See services, prices and real availability.`,
    alternates: { canonical: `/clinic/${f.c.id}/dentist/${f.d.id}/` },
  };
}

export default function Page({ params }: { params: Params }) {
  const f = find(params);
  if (!f) notFound();
  const { c, d } = f;
  const initials = d.name
    .replace('Dr. ', '')
    .split(' ')
    .map((w) => w[0])
    .join('');
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/search/">Find a dentist</Link> / <Link href={`/clinic/${c.id}/`}>{c.name}</Link> / {d.name}
        </nav>
        <div className="dentist-hero">
          <i style={{ background: d.color }} aria-hidden="true">
            {initials}
          </i>
          <div>
            <h1>
              {d.name}, {d.title}
            </h1>
            <p className="muted">
              {d.specialty} · {years(c.id + d.id)} years of experience · {CITIES[c.city].name}
            </p>
            <Link className="btn" href={`/clinic/${c.id}/?dentist=${d.id}`}>
              Book with {d.name}
            </Link>
          </div>
        </div>
        <div className="two-col">
          <div className="stack wide">
            <h2>About</h2>
            <p>
              {d.name} focuses on {FOCUS[d.specialty] ?? 'comprehensive dental care'}. Based at{' '}
              <Link href={`/clinic/${c.id}/`} className="link">
                {c.name}
              </Link>
              , {c.address}, and speaks {c.languages.join(' and ')}.
            </p>
            <p>
              {c.newPatients ? 'Accepting new patients.' : 'Not accepting new patients at the moment.'} In-network with {c.insurance.join(', ')}.
            </p>
            <h2>Services & prices</h2>
            <div className="table">
              {c.services.map((s) => (
                <div key={s.id} className="trow">
                  <span>{s.name}</span>
                  <em>{s.minutes} min</em>
                  <b>{s.price ? `$${s.price}` : 'Free'}</b>
                </div>
              ))}
            </div>
            <h2>What patients say about the clinic</h2>
            {c.reviews.map((r) => (
              <div key={r.author} className="review">
                <b>
                  {'★'.repeat(r.rating)} {r.author} · {r.ago}
                </b>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
          <aside className="booking" style={{ position: 'static' }}>
            <h3>Other dentists at {c.name}</h3>
            {c.dentists
              .filter((x) => x.id !== d.id)
              .map((x) => (
                <Link key={x.id} href={`/clinic/${c.id}/dentist/${x.id}/`} className="dentist">
                  <i style={{ background: x.color }}>
                    {x.name
                      .replace('Dr. ', '')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </i>
                  <div>
                    <b>
                      {x.name}, {x.title}
                    </b>
                    <span>{x.specialty}</span>
                  </div>
                </Link>
              ))}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
