import Link from 'next/link';
import Logo from './Logo';
import { CITIES, CityKey } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap foot-grid">
        <div>
          <Logo />
          <p className="muted">Find a dentist near you and book online in under a minute.</p>
        </div>
        <nav aria-label="Teeth cleaning by city">
          <h4>Teeth cleaning</h4>
          {(Object.keys(CITIES) as CityKey[]).map((k) => (
            <Link key={k} href={`/dentists/${k}/cleaning/`}>
              {CITIES[k].name}
            </Link>
          ))}
        </nav>
        <nav aria-label="For patients">
          <h4>Patients</h4>
          <Link href="/search/">Find a dentist</Link>
          <Link href="/compare/">Compare clinics</Link>
          <Link href="/my-bookings/">My bookings</Link>
          <Link href="/login/">Log in</Link>
        </nav>
        <nav aria-label="Company">
          <h4>Company</h4>
          <Link href="/for-clinics/">For clinics</Link>
          <Link href="/contact/">Contact</Link>
          <Link href="/privacy/">Privacy</Link>
          <Link href="/terms/">Terms</Link>
        </nav>
      </div>
      <div className="wrap foot-note">Demo project — clinics, dentists, patients and reviews are fictional. No real bookings or payments.</div>
    </footer>
  );
}
