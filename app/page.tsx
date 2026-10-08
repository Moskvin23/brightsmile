import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import HomeSearch from '@/components/HomeSearch';
import { CITIES, CityKey, clinics, SERVICES } from '@/lib/data';

export const metadata: Metadata = { alternates: { canonical: '/' } };

const active = clinics.filter((c) => c.status === 'Active');
const top = [...active]
  .filter((c) => c.reviewCount > 150)
  .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
  .slice(0, 6);
const quotes = active
  .slice(0, 40)
  .flatMap((c) => c.reviews.slice(0, 1).map((r) => ({ ...r, clinic: c.name })))
  .filter((q, i, all) => q.rating === 5 && all.findIndex((x) => x.text === q.text) === i) // three different quotes
  .slice(0, 3);
const ICON: Record<string, string> = { cleaning: '✨', exam: '🔍', whitening: '😁', filling: '🦷', invisalign: '😬', emergency: '🚑', kids: '🧒' };

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero">
          <div className="wrap">
            <h1>Find a dentist and book in under a minute</h1>
            <p>Compare prices, insurance and real availability for {active.length} clinics — then pick a time that works.</p>
            <HomeSearch />
            <p className="hero-note">
              Popular:{' '}
              {SERVICES.slice(0, 4).map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ' · '}
                  <Link href={`/search/?service=${s.id}`}>{s.name}</Link>
                </span>
              ))}
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap stats">
            <div>
              <b>{active.length}</b>
              <span>clinics</span>
            </div>
            <div>
              <b>{Object.keys(CITIES).length}</b>
              <span>cities</span>
            </div>
            <div>
              <b>{active.reduce((s, c) => s + c.bookings30d, 0).toLocaleString('en-US')}</b>
              <span>bookings last month</span>
            </div>
            <div>
              <b>$25</b>
              <span>refundable deposit</span>
            </div>
          </div>
        </section>

        <section className="wrap section">
          <h2>Book by service</h2>
          <div className="grid-cards">
            {SERVICES.map((s) => (
              <Link key={s.id} href={`/search/?service=${s.id}`} className="tile">
                <span className="tile-ico" aria-hidden="true">
                  {ICON[s.id]}
                </span>
                <b>{s.name}</b>
                <span className="muted">
                  {s.base ? `from $${Math.round(s.base * 0.8)}` : 'free consultation'} · {s.minutes} min
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <h2>Top-rated clinics</h2>
          <div className="grid-cards three">
            {top.map((c) => (
              <Link key={c.id} href={`/clinic/${c.id}/`} className="tile clinic-tile">
                <i className="tile-photo" style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }} aria-hidden="true" />
                <b>{c.name}</b>
                <span className="muted">
                  ★ {c.rating.toFixed(1)} ({c.reviewCount}) · {CITIES[c.city].name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <h2>Choose your city</h2>
          <div className="grid-cards three">
            {(Object.keys(CITIES) as CityKey[]).map((k) => (
              <div key={k} className="tile city-tile">
                <b>{CITIES[k].name}</b>
                <span className="muted">{active.filter((c) => c.city === k).length} clinics</span>
                <Link className="link" href={`/search/?city=${k}`}>
                  See all clinics →
                </Link>
                <Link className="link" href={`/dentists/${k}/cleaning/`}>
                  Teeth cleaning in {CITIES[k].name.split(',')[0]} →
                </Link>
                <Link className="link" href={`/dentists/${k}/whitening/`}>
                  Teeth whitening in {CITIES[k].name.split(',')[0]} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="band alt">
          <div className="wrap section">
            <h2>How it works</h2>
            <ol className="steps-big">
              <li>
                <b>1. Search</b>
                <p>Filter by service, insurance, price, language and open weekends — on a map or a list.</p>
              </li>
              <li>
                <b>2. Pick a time</b>
                <p>See real free slots for every clinic and dentist. No phone calls, no waiting on hold.</p>
              </li>
              <li>
                <b>3. Confirm</b>
                <p>Leave a refundable $25 deposit and get the visit in your calendar.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="wrap section">
          <h2>Patients say</h2>
          <div className="grid-cards three">
            {quotes.map((q) => (
              <figure key={q.author + q.clinic} className="tile quote">
                <blockquote>“{q.text}”</blockquote>
                <figcaption>
                  {q.author} · {q.clinic}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <div className="cta">
            <div>
              <h2>Run a dental clinic?</h2>
              <p>Get online bookings, a clean calendar and fewer no-shows. Set up in a day.</p>
            </div>
            <Link href="/for-clinics/" className="btn">
              See how it works
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
