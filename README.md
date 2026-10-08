# Brightsmile — dental clinic finder, online booking & admin

A portfolio project: patients find a dentist on a map, compare clinics and book an appointment; clinics run their calendar in an admin panel; a platform team manages all clinics in a second admin.

> All clinics, dentists, patients and reviews are **fictional** and generated from a fixed seed. There is no backend — bookings live in the browser's `localStorage` — and no real payment or email is ever sent.

**Stack:** Next.js 14 (App Router, static export) · React 18 · TypeScript · MapLibre GL · plain CSS · Vitest · Playwright

## What's in it

**Public site**

| Page                           | What it shows                                                                                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` Home                       | Hero search, services, top clinics, cities, how it works, testimonials                                                                                                                                                     |
| `/search/` Search              | Map + list with clustering, hover/selection sync, “search this area”, 9 filters, 5 sort orders, saved clinics (♥), compare tray. Clicking a card flies the map to the clinic and highlights its pin                         |
| `/clinic/[id]/` Clinic         | Services & prices, dentists, reviews, location map and a 5-step booking flow (service → dentist → time → validated details → deposit → confirmation + `.ics`)                                                              |
| `/clinic/[id]/dentist/[did]/`  | Dentist profile with direct “Book with …”                                                                                                                                                                                  |
| `/dentists/[city]/[service]/`  | Statically generated SEO landing pages (e.g. _Teeth whitening in Austin_) with structured data                                                                                                                             |
| `/compare/`                    | Side-by-side comparison of up to 3 clinics                                                                                                                                                                                 |
| `/my-bookings/`                | Upcoming / past visits, reschedule and cancel (frees the slot)                                                                                                                                                             |
| `/for-clinics/`                | Marketing page: benefits, pricing, FAQ, demo request form                                                                                                                                                                  |
| `/login/`, `/contact/`, legal  | Demo sign-in, contact form, privacy & terms; custom 404 and error pages                                                                                                                                                    |

**Clinic admin** (`/admin/`) — day / week / month calendar by dentist, status changes, “+ New appointment” with clash detection, dashboard, patients, services & prices, reminders, settings.

**Platform admin** (`/admin/platform/`) — KPIs, search, filters (city, status, rating, plan, created), sortable table with pagination and row actions, bulk approve / suspend, CSV export, **+ Add clinic**, table/map toggle, plus overview, bookings, payments, reviews moderation and users.

## Things worth a look in the code

- **Availability is time-zone safe.** Slots are generated per clinic and calendar day (`lib/data.ts`), “now” is evaluated on the _clinic's_ wall clock (`nowIn`), and dates never go through UTC — so a visitor in Kyiv sees the same “Today” as one in Austin.
- **No double bookings.** `takenFor` (`lib/bookings.ts`) hides booked slots from the search list and the clinic page, “first available” is assigned to a dentist who is actually free, and a final check runs right before payment (e.g. when the slot was taken in another tab).
- **Map ↔ list sync** (`components/MapView.tsx`). Pins are HTML markers mirroring un-clustered GeoJSON features, synced on a throttle instead of per frame; selecting a clinic from the list zooms above the cluster threshold so its pin exists.
- **Accessible custom dropdown** (`components/Select.tsx`): keyboard navigation, `listbox` roles, rendered in a portal so overflow containers never clip it. A reusable focus-trapping `Modal` is used for dialogs.
- **SEO:** per-page metadata, `sitemap.xml`, `robots.txt`, Open Graph image, JSON-LD on landing pages, 600+ statically generated pages.
- **Quality gates:** ESLint, strict TypeScript, Prettier, unit tests for the scheduling logic and Playwright end-to-end tests for the main flows, all run in CI.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command                 | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run build`         | Static export into `out/`                                                 |
| `npm run lint`          | ESLint (`next/core-web-vitals`)                                           |
| `npm run typecheck`     | `tsc --noEmit`                                                            |
| `npm test`              | Vitest unit tests                                                         |
| `npm run test:e2e`      | Playwright E2E (starts its own dev server on :3100; uses installed Chrome) |
| `npm run check`         | lint + typecheck + unit tests                                             |
| `npm run format`        | Prettier                                                                  |

Set `NEXT_PUBLIC_SITE_URL` to your deployed origin so the sitemap, canonical URLs and Open Graph tags are absolute.

## Project layout

```
app/            routes (pages, sitemap, robots, error/404)
components/     UI: Search, ClinicCard, ClinicView, MapView, Select, Modal, admin shell, forms …
lib/            data generator + scheduling (data.ts), bookings, favorites, compare, appointments
tests/          Vitest unit tests
e2e/            Playwright tests
```

## Design decisions

- **`localStorage` instead of a backend** keeps the demo deployable as a static site while still exercising real flows (a booking made on the public site shows up in the clinic calendar and in “My bookings”).
- **Seeded data** (`mulberry32`) makes every page deterministic, which is what lets list, map, clinic page and admin always agree.
- **Plain CSS with a few variables** — no UI kit — to keep the bundle small (the heaviest page ships ~110 kB of JS) and the design easy to read.

## If this became a real product

PostgreSQL + PostGIS (Prisma) for clinics and geo queries, Auth.js for patients and clinic staff, Stripe (test mode first) for deposits, a transactional email/SMS provider for confirmations and reminders, slot locking at the database level to make double booking impossible across devices, and role-based access for the two admin areas.

Map tiles: © [OpenFreeMap](https://openfreemap.org), © OpenMapTiles, data from OpenStreetMap.
