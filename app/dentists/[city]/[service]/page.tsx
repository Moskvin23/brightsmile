import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { CITIES, CityKey, clinics, SERVICES } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

type Params = { city: string; service: string };

export function generateStaticParams() {
  return (Object.keys(CITIES) as CityKey[]).flatMap((city) => SERVICES.map((s) => ({ city, service: s.id })));
}

function load({ city, service }: Params) {
  const svc = SERVICES.find((s) => s.id === service);
  if (!svc || !(city in CITIES)) return null;
  const key = city as CityKey;
  const list = clinics
    .filter((c) => c.city === key && c.status === 'Active' && c.services.some((s) => s.id === service))
    .map((c) => ({ c, price: c.services.find((s) => s.id === service)!.price }))
    .sort((a, b) => b.c.rating - a.c.rating || b.c.reviewCount - a.c.reviewCount);
  return { svc, key, list };
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const d = load(params);
  if (!d) return { title: 'Not found' };
  const prices = d.list.map((x) => x.price).filter(Boolean);
  const range = prices.length ? ` Prices from $${Math.min(...prices)}.` : '';
  return {
    title: `${d.svc.name} in ${CITIES[d.key].name} — ${d.list.length} dentists, prices & online booking`,
    description: `Compare ${d.list.length} dental clinics offering ${d.svc.name.toLowerCase()} in ${CITIES[d.key].name}.${range} Book online in under a minute.`,
    alternates: { canonical: `/dentists/${d.key}/${d.svc.id}/` },
  };
}

export default function Page({ params }: { params: Params }) {
  const d = load(params);
  if (!d) notFound();
  const { svc, key, list } = d;
  const city = CITIES[key].name;
  const prices = list.map((x) => x.price).filter(Boolean);
  const avg = prices.length ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${svc.name} in ${city}`,
    itemListElement: list.slice(0, 10).map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/clinic/${x.c.id}/`, name: x.c.name })),
  };
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link> / <Link href={`/search/?city=${key}`}>{city}</Link> / {svc.name}
        </nav>
        <h1>
          {svc.name} in {city}
        </h1>
        <p className="lead">
          {list.length} clinics offer {svc.name.toLowerCase()} in {city}.
          {avg ? ` The average price is $${avg}, ranging from $${Math.min(...prices)} to $${Math.max(...prices)}.` : ' Many clinics offer a free consultation.'}{' '}
          A visit takes about {svc.minutes} minutes.
        </p>
        <div className="row-gap" style={{ marginBottom: 20 }}>
          <Link className="btn" href={`/search/?city=${key}&service=${svc.id}`}>
            See availability on the map
          </Link>
        </div>
        <ol className="rank">
          {list.slice(0, 10).map(({ c, price }, i) => (
            <li key={c.id} className="rank-item">
              <span className="rank-n">{i + 1}</span>
              <i className="tile-photo" style={{ background: `linear-gradient(135deg, ${c.photo}, #f1f5f9)` }} aria-hidden="true" />
              <div>
                <Link href={`/clinic/${c.id}/`} className="name">
                  {c.name}
                </Link>
                <p className="meta">
                  ★ {c.rating.toFixed(1)} ({c.reviewCount} reviews) · {c.address}
                </p>
                <p className="meta">In-network: {c.insurance.slice(0, 3).join(', ')}</p>
              </div>
              <div className="rank-price">
                <b>{price ? `$${price}` : 'Free'}</b>
                <Link className="btn ghost" href={`/clinic/${c.id}/?service=${svc.id}`}>
                  Book
                </Link>
              </div>
            </li>
          ))}
        </ol>
        <h2 className="h2s">Other services in {city}</h2>
        <div className="chips-row">
          {SERVICES.filter((s) => s.id !== svc.id).map((s) => (
            <Link key={s.id} className="chip" href={`/dentists/${key}/${s.id}/`}>
              {s.name}
            </Link>
          ))}
        </div>
        <h2 className="h2s">{svc.name} in other cities</h2>
        <div className="chips-row">
          {(Object.keys(CITIES) as CityKey[])
            .filter((k) => k !== key)
            .map((k) => (
              <Link key={k} className="chip" href={`/dentists/${k}/${svc.id}/`}>
                {CITIES[k].name}
              </Link>
            ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
