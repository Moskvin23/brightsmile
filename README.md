# Brightsmile — clinic finder, online booking & admin

Demo web app: patients search dental clinics on a map, filter and sort them, and book an appointment. Clinics manage their calendar in an admin panel, and the platform team manages all clinics in a second admin.

All clinics, dentists, patients and reviews are **fictional** and generated from a fixed seed.

## Features

**Public site**
- Map + list search (MapLibre GL, OpenFreeMap tiles) with marker clustering, hover sync between list and map, "Search this area"
- Filters: service, city, insurance, available today, rating, price, language, new patients, weekends
- Sorting: nearest, soonest available, highest rated, most reviewed, lowest price
- Clinic page: services & prices, dentists, reviews, location map
- 5-step booking: service → dentist → date & time → details (validated) → deposit (demo mode, no real charge) → confirmation + `.ics` calendar file

**Clinic admin** (`/admin`)
- Day calendar by dentist, colour-coded statuses, "now" line, appointment drawer with status changes
- Bookings made on the public site appear here (stored in the browser's localStorage)
- Dashboard: appointments per day, online share, revenue, no-show rate, bookings by service
- Patients list with search

**Platform admin** (`/admin/platform`)
- KPIs, search, filters (city, status, plan, rating), sortable columns, pagination
- Bulk select → approve / suspend, CSV export, table/map toggle

Fully responsive: on phones the search switches between list and map, admin sidebar becomes a drawer.

## Stack
Next.js 14 (App Router, static export) · React 18 · TypeScript · MapLibre GL · plain CSS

## Run
```bash
npm install
npm run dev
```
Build: `npm run build` → static site in `out/`.

## Not included in this demo
No real backend yet: data is generated client-side and bookings live in localStorage. The next step would be PostgreSQL + PostGIS (Prisma), Auth.js, Stripe test mode and transactional email.
