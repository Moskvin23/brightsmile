import Link from 'next/link';
import Logo from './Logo';

/** Header for the marketing / content pages (the search page has its own bar with the search fields). */
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Logo />
        <nav aria-label="Main">
          <Link href="/search/">Find a dentist</Link>
          <Link href="/for-clinics/">For clinics</Link>
          <Link href="/my-bookings/">My bookings</Link>
          <Link href="/login/" className="pill-btn">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
