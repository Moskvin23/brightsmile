import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section empty-page">
        <p className="big-num">404</p>
        <h1>We couldn’t find that page</h1>
        <p className="muted">The clinic or page you’re looking for doesn’t exist or has moved.</p>
        <div className="row-gap" style={{ justifyContent: 'center' }}>
          <Link href="/search/" className="btn">
            Find a dentist
          </Link>
          <Link href="/" className="btn ghost">
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
