import type { Metadata } from 'next';
import Search from '@/components/Search';

export const metadata: Metadata = {
  title: 'Find a dentist — compare clinics, prices and availability',
  description: 'Search dental clinics on a map and in a list. Filter by insurance, rating, price and language, then book online.',
  alternates: { canonical: '/search/' },
};

export default function Page() {
  return <Search />;
}
