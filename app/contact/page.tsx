import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with the Brightsmile team.', alternates: { canonical: '/contact/' } };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section two-col">
        <div>
          <h1>Contact us</h1>
          <p className="lead">Questions about booking, or want to list your clinic? Send a message and we will get back to you.</p>
          <p className="muted">This is a portfolio demo, so messages are not delivered anywhere.</p>
        </div>
        <div className="booking" style={{ position: 'static' }}>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
