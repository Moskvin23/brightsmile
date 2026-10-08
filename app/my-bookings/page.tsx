import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import MyBookings from '@/components/MyBookings';

export const metadata: Metadata = { title: 'My bookings', description: 'See, reschedule or cancel your dental appointments.', robots: { index: false } };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section">
        <MyBookings />
      </main>
      <Footer />
    </>
  );
}
