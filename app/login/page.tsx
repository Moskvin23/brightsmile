import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to manage your dental appointments, or open the clinic and platform admin demos.',
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section">
        <h1 style={{ textAlign: 'center' }}>Welcome back</h1>
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}
