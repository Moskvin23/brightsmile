// Demo data: every clinic, dentist, patient and review is fictional and generated
// from a fixed seed, so the site looks the same on every load.

export type Service = { id: string; name: string; minutes: number; price: number };
export type Dentist = { id: string; name: string; title: string; specialty: string; color: string };
export type Review = { author: string; ago: string; rating: number; text: string };
export type Clinic = {
  id: string;
  name: string;
  city: CityKey;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  insurance: string[];
  languages: string[];
  newPatients: boolean;
  weekends: boolean;
  services: Service[];
  dentists: Dentist[];
  reviews: Review[];
  photo: string; // gradient color
  plan: 'Starter' | 'Growth' | 'Pro' | 'Trial';
  status: 'Active' | 'Pending review' | 'Suspended';
  createdDaysAgo: number;
  bookings30d: number;
};

export const CITIES = {
  austin: { name: 'Austin, TX', center: [-97.7431, 30.2672] as [number, number] },
  denver: { name: 'Denver, CO', center: [-104.9903, 39.7392] as [number, number] },
  miami: { name: 'Miami, FL', center: [-80.2101, 25.7817] as [number, number] },
};
export type CityKey = keyof typeof CITIES;

export const SERVICES = [
  { id: 'cleaning', name: 'Teeth cleaning', minutes: 45, base: 95 },
  { id: 'exam', name: 'New patient exam + X-rays', minutes: 60, base: 150 },
  { id: 'whitening', name: 'Teeth whitening', minutes: 90, base: 350 },
  { id: 'filling', name: 'Filling', minutes: 45, base: 140 },
  { id: 'invisalign', name: 'Invisalign consultation', minutes: 30, base: 0 },
  { id: 'emergency', name: 'Emergency visit', minutes: 30, base: 120 },
  { id: 'kids', name: 'Kids check-up', minutes: 30, base: 75 },
];

export const INSURANCE = ['Delta Dental', 'Aetna', 'Cigna', 'MetLife', 'Guardian', 'UnitedHealthcare'];
export const LANGUAGES = ['English', 'Spanish', 'Vietnamese', 'Mandarin', 'Hindi'];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PREFIX: Record<CityKey, string[]> = {
  austin: [
    'Lakeview',
    'Congress Ave',
    'Barton Creek',
    'Eastside',
    'Mueller',
    'South Congress',
    'Hyde Park',
    'Riverside',
    'Zilker',
    'Domain',
    'Clarksville',
    'Bouldin',
    'Travis Heights',
    'Cedar Park',
    'Rainey Street',
    'Crestview',
    'Allandale',
  ],
  denver: [
    'Cherry Creek',
    'LoDo',
    'Highland',
    'Capitol Hill',
    'Washington Park',
    'RiNo',
    'Sloan Lake',
    'Baker',
    'Platt Park',
    'Stapleton',
    'Union Station',
    'Berkeley',
    'Congress Park',
    'Golden Triangle',
    'Five Points',
    'Park Hill',
  ],
  miami: [
    'Brickell',
    'Coral Way',
    'Little Havana',
    'Wynwood',
    'Coconut Grove',
    'Midtown',
    'Edgewater',
    'Design District',
    'Shenandoah',
    'Little River',
    'Allapattah',
    'Flagami',
    'Westchester',
    'Overtown',
    'Upper East Side',
    'Silver Bluff',
  ],
};
const SUFFIX = [
  'Family Dental',
  'Smile Studio',
  'Dental Care',
  'Dentistry',
  'Dental Group',
  'Orthodontics',
  'Kids Dentistry',
  'Dental Spa',
  'Smiles',
  'Dental Arts',
];
const STREETS: Record<CityKey, string[]> = {
  austin: ['S Lamar Blvd', 'Congress Ave', 'E 6th St', 'Burnet Rd', 'S 1st St', 'Manor Rd', 'W 38th St', 'E Riverside Dr', 'N Lamar Blvd'],
  denver: ['Colfax Ave', 'Broadway', 'Larimer St', 'E 17th Ave', 'S Pearl St', 'Tennyson St', 'Federal Blvd', 'Speer Blvd'],
  miami: ['Brickell Ave', 'SW 8th St', 'Biscayne Blvd', 'NW 2nd Ave', 'Coral Way', 'Grand Ave', 'NE 2nd Ave', 'SW 27th Ave'],
};
const FIRST = [
  'Emily',
  'James',
  'Priya',
  'Michael',
  'Sarah',
  'David',
  'Laura',
  'Daniel',
  'Olivia',
  'Carlos',
  'Mei',
  'Ahmed',
  'Rachel',
  'Kevin',
  'Sofia',
  'Thomas',
  'Hannah',
  'Luis',
  'Grace',
  'Ryan',
];
const LAST = [
  'Carter',
  'Rivera',
  'Shah',
  'Nguyen',
  'Patel',
  'Kim',
  'Johnson',
  'Brooks',
  'Chen',
  'Lopez',
  'Wright',
  'Martinez',
  'Reed',
  'Foster',
  'Hughes',
  'Bennett',
  'Ortiz',
  'Ward',
];
const SPECIALTIES = ['General dentistry', 'Orthodontics', 'Cosmetic', 'Pediatric', 'Endodontics', 'Periodontics'];
const AVATARS = ['#FBCFE8', '#BFDBFE', '#FDE68A', '#BBF7D0', '#DDD6FE', '#FECACA'];
const PHOTOS = ['#5EEAD4', '#BAE6FD', '#FDE68A', '#C7D2FE', '#FBCFE8', '#BBF7D0', '#FED7AA'];
const REVIEW_TEXT = [
  'Super gentle cleaning and they were running on time. Booking online took 30 seconds.',
  'Clear prices before the visit, no surprises on the bill. Front desk was very friendly.',
  'Got an emergency slot the same afternoon. Pain gone, great explanation of options.',
  'My kids actually like going here now. Patient and fun staff.',
  'Modern office, quick X-rays and a dentist who listens. Highly recommend.',
  'Whitening results were amazing and the follow-up call was a nice touch.',
];
const REVIEWERS = ['Megan T.', 'Carlos R.', 'Jessica L.', 'Brian K.', 'Ana P.', 'Tyler S.', 'Nina W.', 'Marcus D.'];

function pick<T>(r: () => number, arr: T[]) {
  return arr[Math.floor(r() * arr.length)];
}
function pickN<T>(r: () => number, arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]);
  return out;
}

function makeClinics(): Clinic[] {
  const r = mulberry32(20261007);
  const out: Clinic[] = [];
  (Object.keys(CITIES) as CityKey[]).forEach((city) => {
    const [clng, clat] = CITIES[city].center;
    const used = new Set<string>();
    for (let i = 0; i < 50; i++) {
      let name = '';
      do {
        name = `${pick(r, PREFIX[city])} ${pick(r, SUFFIX)}`;
      } while (used.has(name));
      used.add(name);
      // gaussian-ish scatter around downtown
      const ang = r() * Math.PI * 2;
      const dist = Math.pow(r(), 0.7) * 0.11;
      let lng = clng + Math.cos(ang) * dist * 1.15;
      const lat = clat + Math.sin(ang) * dist * 0.9;
      if (city === 'miami') lng = Math.min(lng, -80.19); // keep out of the bay
      const priceK = 0.8 + r() * 0.5;
      const services = SERVICES.filter((s) => s.id === 'cleaning' || s.id === 'exam' || r() > 0.35).map((s) => ({
        id: s.id,
        name: s.name,
        minutes: s.minutes,
        price: Math.round((s.base * priceK) / 5) * 5,
      }));
      const nDent = 2 + Math.floor(r() * 3);
      const dentists: Dentist[] = Array.from({ length: nDent }, (_, k) => {
        const sp = k === 0 ? 'General dentistry' : pick(r, SPECIALTIES);
        return {
          id: `d${k}`,
          name: `Dr. ${pick(r, FIRST)} ${pick(r, LAST)}`,
          title: r() > 0.5 ? 'DDS' : 'DMD',
          specialty: sp,
          color: AVATARS[k % AVATARS.length],
        };
      });
      const rating = Math.round((3.9 + Math.pow(r(), 0.5) * 1.1) * 10) / 10;
      const statusRoll = r();
      out.push({
        id: `${city.slice(0, 3)}-${String(i + 1).padStart(2, '0')}`,
        name,
        city,
        address: `${100 + Math.floor(r() * 4800)} ${pick(r, STREETS[city])}`,
        lat,
        lng,
        rating: Math.min(rating, 5),
        reviewCount: 12 + Math.floor(r() * 340),
        insurance: pickN(r, INSURANCE, 2 + Math.floor(r() * 3)),
        languages: ['English', ...pickN(r, LANGUAGES.slice(1), city === 'miami' ? 2 : Math.floor(r() * 2))],
        newPatients: r() > 0.15,
        weekends: r() > 0.55,
        services,
        dentists,
        reviews: pickN(r, REVIEW_TEXT, 3).map((text, k) => ({
          author: REVIEWERS[(i + k) % REVIEWERS.length],
          ago: `${1 + Math.floor(r() * 8)} weeks ago`,
          rating: r() > 0.2 ? 5 : 4,
          text,
        })),
        photo: PHOTOS[i % PHOTOS.length],
        plan: pick(r, ['Starter', 'Growth', 'Growth', 'Pro'] as const),
        status: statusRoll > 0.95 ? 'Suspended' : statusRoll > 0.89 ? 'Pending review' : 'Active',
        createdDaysAgo: Math.floor(r() * 400),
        bookings30d: 20 + Math.floor(r() * 300),
      });
    }
  });
  // Flagship clinic used in the clinic admin demo
  const f = out[0];
  f.name = 'Lakeview Family Dental';
  f.rating = 4.9;
  f.reviewCount = 312;
  f.status = 'Active';
  f.plan = 'Growth';
  f.address = '2104 S Lamar Blvd';
  f.lat = 30.2489;
  f.lng = -97.7697;
  f.newPatients = true;
  f.weekends = true;
  f.insurance = ['Delta Dental', 'Aetna', 'Cigna'];
  f.languages = ['English', 'Spanish'];
  f.dentists = [
    { id: 'd0', name: 'Dr. Emily Carter', title: 'DDS', specialty: 'General dentistry', color: '#FBCFE8' },
    { id: 'd1', name: 'Dr. James Rivera', title: 'DMD', specialty: 'Orthodontics', color: '#BFDBFE' },
    { id: 'd2', name: 'Dr. Priya Shah', title: 'DDS', specialty: 'Cosmetic', color: '#FDE68A' },
    { id: 'd3', name: 'Anna Lee', title: 'RDH', specialty: 'Hygienist', color: '#BBF7D0' },
  ];
  f.bookings30d = 312;
  return out;
}

export const clinics = makeClinics();
export const getClinic = (id: string) => clinics.find((c) => c.id === id);
export const DEPOSIT = 25;

// ---- availability --------------------------------------------------------
// Slots are deterministic per clinic + day, so the list, the map and the clinic
// page always agree.
export const SLOT_TIMES = ['8:00 AM', '9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM', '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM', '4:00 PM', '4:45 PM'];

function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Calendar days are always the *wall-clock* date of the Date object (never UTC), so a
// slot labelled "Today" links to the same day it was generated for in any timezone.
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TZ: Record<CityKey, string> = { austin: 'America/Chicago', denver: 'America/Denver', miami: 'America/New_York' };

/** "Now" on the clinic's own wall clock, so availability doesn't depend on where the visitor is. */
/** The real instant at which `minutes` after midnight on `day` (YYYY-MM-DD) happens on the clinic's wall clock. */
export function clinicTimeToUtc(city: CityKey, day: string, minutes: number): Date {
  const [y, m, d] = day.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const offsetAt = (t: number) => {
    const w = nowIn(city, new Date(t));
    return Date.UTC(w.getFullYear(), w.getMonth(), w.getDate(), w.getHours(), w.getMinutes()) - t;
  };
  // second pass handles times next to a daylight-saving change
  return new Date(wall - offsetAt(wall - offsetAt(wall)));
}

export function nowIn(city: CityKey, at: Date = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ[city],
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(at)
      .map((x) => [x.type, Number(x.value)]),
  );
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute);
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Returns true when a slot is already booked (see lib/bookings.ts). */
export type TakenFn = (day: string, time: string, dentistId: string) => boolean;

export function slotsFor(c: Clinic, day: Date, dentistId = 'any', taken?: TakenFn): string[] {
  const dow = day.getDay();
  if (dow === 0 || (dow === 6 && !c.weekends)) return [];
  const r = mulberry32(hash(c.id + dayKey(day) + dentistId));
  const times = dow === 6 ? SLOT_TIMES.slice(0, 5) : SLOT_TIMES;
  const k = dayKey(day);
  return times.filter(() => r() > 0.62).filter((t) => !taken?.(k, t, dentistId));
}

export function nextSlots(c: Clinic, from: Date, n = 3, taken?: TakenFn) {
  const res: { day: Date; time: string }[] = [];
  for (let i = 0; i < 10 && res.length < n; i++) {
    const day = addDays(from, i);
    for (const t of slotsFor(c, day, 'any', taken)) {
      if (i === 0 && toMinutes(t) <= from.getHours() * 60 + from.getMinutes()) continue;
      res.push({ day, time: t });
      if (res.length >= n) break;
    }
  }
  return res;
}

export function toMinutes(t: string) {
  const [hm, ap] = t.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (ap === 'PM' && h !== 12) h += 12;
  return h * 60 + m;
}

export function dayLabel(day: Date, today: Date) {
  const diff = Math.round((new Date(dayKey(day)).getTime() - new Date(dayKey(today)).getTime()) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return day.toLocaleDateString('en-US', { weekday: 'short' });
}

export function distanceMi(a: [number, number], b: [number, number]) {
  const R = 3958.8,
    toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR,
    dLng = (b[0] - a[0]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
