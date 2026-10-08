import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import CompareView from '@/components/CompareView';

export const metadata: Metadata = {
  title: 'Compare clinics',
  description: 'Compare dental clinics side by side: price, rating, insurance, languages and next available time.',
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section">
        <CompareView />
      </main>
      <Footer />
    </>
  );
}
