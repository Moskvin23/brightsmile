import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import DemoRequestForm from '@/components/DemoRequestForm';

export const metadata: Metadata = {
  title: 'For clinics — online booking, calendar and fewer no-shows',
  description: 'Online booking for dental clinics: a day/week/month calendar, deposits that cut no-shows, reminders and a patient list. Try the live demo.',
  alternates: { canonical: '/for-clinics/' },
};

const BENEFITS = [
  ['📅', 'One calendar for every dentist', 'Day, week and month views with colour-coded statuses and a live “now” line.'],
  ['💳', 'Deposits cut no-shows', 'A refundable deposit at booking time keeps empty chairs to a minimum.'],
  ['🔔', 'Automatic reminders', 'Email and SMS reminders before every visit, plus 6-month recall.'],
  ['🗺️', 'Be found on the map', 'Patients compare price, rating and next free slot — you appear with real availability.'],
  ['📈', 'See what works', 'Appointments per day, online share, revenue and no-show rate on one dashboard.'],
  ['👥', 'Patient list built for you', 'Visits, last appointment and spend per patient, searchable by name or phone.'],
];
const PLANS = [
  { name: 'Starter', price: 49, text: 'For a single-dentist practice.', items: ['Online booking page', '1 dentist calendar', 'Email reminders'] },
  {
    name: 'Growth',
    price: 129,
    text: 'Most popular for family clinics.',
    items: ['Up to 5 dentists', 'Deposits & SMS reminders', 'Dashboard & patient list'],
    hot: true,
  },
  { name: 'Pro', price: 249, text: 'For multi-location groups.', items: ['Unlimited dentists', 'Priority placement on the map', 'Dedicated onboarding'] },
];
const FAQ = [
  ['How long does setup take?', 'Most clinics are live within a day: add your dentists, services and hours, and the booking page is ready.'],
  ['Do patients need an account?', 'No. Patients book with name, email and phone, and get a calendar file after payment.'],
  ['What happens to the deposit?', 'It is refundable with free cancellation up to 24 hours before the visit, and is deducted from the final bill.'],
  ['Can I keep taking phone bookings?', 'Yes. Add them to the same calendar with “+ New appointment” so online slots are always accurate.'],
  [
    'Is this a real product?',
    'This is a portfolio demo with fictional data. The calendar and booking flow are fully interactive, but nothing is sent or charged.',
  ],
];

export default function ForClinics() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero">
          <div className="wrap">
            <h1>More patients booked. Fewer empty chairs.</h1>
            <p>Brightsmile gives your clinic an online booking page, a calendar your whole team can use and deposits that keep patients coming.</p>
            <div className="hero-actions">
              <Link href="/admin/" className="btn">
                Try the live demo
              </Link>
              <a href="#demo" className="btn ghost">
                Request a demo
              </a>
            </div>
          </div>
        </section>
        <section className="wrap section">
          <h2>Everything a clinic needs</h2>
          <div className="grid-cards three">
            {BENEFITS.map(([ico, t, d]) => (
              <div key={t} className="tile">
                <span className="tile-ico" aria-hidden="true">
                  {ico}
                </span>
                <b>{t}</b>
                <span className="muted">{d}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="band alt">
          <div className="wrap section">
            <h2>Simple pricing</h2>
            <div className="grid-cards three">
              {PLANS.map((p) => (
                <div key={p.name} className={`tile plan${p.hot ? ' hot' : ''}`}>
                  {p.hot && <em className="badge s-online">Most popular</em>}
                  <b>{p.name}</b>
                  <span className="plan-price">
                    ${p.price}
                    <small>/month</small>
                  </span>
                  <span className="muted">{p.text}</span>
                  <ul>
                    {p.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              Demo prices. 30-day free trial on every plan.
            </p>
          </div>
        </section>
        <section className="wrap section two-col">
          <div>
            <h2>Questions</h2>
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div id="demo" className="booking" style={{ position: 'static' }}>
            <h3>Request a demo</h3>
            <DemoRequestForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
