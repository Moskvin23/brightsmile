import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How the Brightsmile demo handles your data.',
  alternates: { canonical: '/privacy/' },
};

export default function Page() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="October 2026"
      intro="Brightsmile is a portfolio demo with fictional clinics. This page shows the kind of policy a real booking product would publish."
      sections={[
        {
          title: 'What this demo stores',
          text: [
            'Bookings, saved clinics and the clinics you compare are kept in your browser’s localStorage only. They never leave your device and you can clear them at any time in your browser settings.',
            'The demo has no server, no database and no analytics, and it does not set cookies.',
          ],
        },
        {
          title: 'Map data',
          text: [
            'Map tiles are loaded from OpenFreeMap (© OpenMapTiles, data from OpenStreetMap). Your browser requests tiles directly from that service, which sees your IP address as any web server would.',
          ],
        },
        {
          title: 'What a real product would add',
          text: [
            'Patient contact details and appointment history would be stored in an encrypted database and shared only with the clinic you book with.',
            'Payments would be handled by a PCI-compliant provider; card numbers would never touch our servers. You could request export or deletion of your data at any time.',
          ],
        },
        { title: 'Questions', text: ['Use the contact page if you have any questions about this demo.'] },
      ]}
    />
  );
}
