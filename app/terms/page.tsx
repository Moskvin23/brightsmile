import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms of use', description: 'Terms for using the Brightsmile demo.', alternates: { canonical: '/terms/' } };

export default function Page() {
  return (
    <LegalPage
      title="Terms of use"
      updated="October 2026"
      intro="Brightsmile is a portfolio demo. No real appointments are made and no money is charged."
      sections={[
        {
          title: 'Fictional data',
          text: [
            'All clinics, dentists, patients, prices and reviews are generated from a fixed seed and are fictional. Any resemblance to real businesses is a coincidence.',
          ],
        },
        {
          title: 'Bookings and deposits',
          text: [
            'In this demo, a booking only exists in your browser. The $25 deposit is simulated — no payment is requested or taken.',
            'A real product would let you cancel for free up to 24 hours before the visit and refund the deposit automatically.',
          ],
        },
        { title: 'Acceptable use', text: ['You may explore the demo freely. Please do not enter real personal or health information into any form.'] },
        { title: 'No medical advice', text: ['Nothing on this site is medical or dental advice. In an emergency, contact your local emergency services.'] },
      ]}
    />
  );
}
