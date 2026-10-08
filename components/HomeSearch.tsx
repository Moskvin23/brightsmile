'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES, CityKey, SERVICES } from '@/lib/data';
import Select from './Select';

export default function HomeSearch() {
  const router = useRouter();
  const [service, setService] = useState('cleaning');
  const [city, setCity] = useState<CityKey>('austin');
  return (
    <form
      className="hero-search"
      action="/search/"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search/?city=${city}&service=${service}`);
      }}
    >
      <div className="sb-field">
        <span>Service</span>
        <Select variant="bare" ariaLabel="Service" value={service} onChange={setService} options={SERVICES.map((s) => ({ value: s.id, label: s.name }))} />
      </div>
      <div className="sb-field">
        <span>Location</span>
        <Select
          variant="bare"
          ariaLabel="Location"
          value={city}
          onChange={(v) => setCity(v as CityKey)}
          options={(Object.keys(CITIES) as CityKey[]).map((k) => ({ value: k, label: CITIES[k].name }))}
        />
      </div>
      {/* without JavaScript the form still works as a plain GET */}
      <input type="hidden" name="service" value={service} />
      <input type="hidden" name="city" value={city} />
      <button className="sb-go" type="submit">
        Find a dentist
      </button>
    </form>
  );
}
