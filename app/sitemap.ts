import type { MetadataRoute } from 'next';
import { CITIES, CityKey, clinics, SERVICES } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (p: string) => `${SITE_URL}${p}`;
  const fixed = ['/', '/search/', '/for-clinics/', '/contact/', '/privacy/', '/terms/'].map((p) => ({ url: url(p), priority: p === '/' ? 1 : 0.7 }));
  const seo = (Object.keys(CITIES) as CityKey[]).flatMap((city) => SERVICES.map((s) => ({ url: url(`/dentists/${city}/${s.id}/`), priority: 0.8 })));
  const pages = clinics
    .filter((c) => c.status === 'Active')
    .flatMap((c) => [
      { url: url(`/clinic/${c.id}/`), priority: 0.6 },
      ...c.dentists.map((d) => ({ url: url(`/clinic/${c.id}/dentist/${d.id}/`), priority: 0.4 })),
    ]);
  return [...fixed, ...seo, ...pages];
}
