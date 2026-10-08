import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Brightsmile — find a dentist near you and book online', template: '%s | Brightsmile' },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Brightsmile — find a dentist near you and book online',
    description: SITE_DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Brightsmile' }],
  },
  twitter: { card: 'summary_large_image', title: 'Brightsmile', description: SITE_DESCRIPTION, images: ['/og.png'] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0d9488' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
