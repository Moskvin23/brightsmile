import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Brightsmile — find a dentist near you and book online',
  description: 'Search dental clinics on a map, filter by insurance, rating and availability, and book in under a minute. Demo project with fictional data.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
