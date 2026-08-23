# UEMF Attendance

Automated university attendance management system with rotating QR codes, GPS-based mobile check-in, student and professor attendance, recurring schedules, and an anomaly dashboard for administration.

Built for the **Operations Research** module at EIDIA, Université Euromed de Fès, during the 2025–2026 academic year.

**Team:** Mouhssine El Boumshouli · Yassine Hamda Benchkroune · Badr Lasri · Mohamed Amine Hajji

## Live demo

The project is deployed online:

**https://student-attendance-system-amber.vercel.app**

Demo accounts use the password `password123`:

| Role | Email |
|---|---|
| Administrator | `admin@eidia.ueuromed.org` |
| Professor | `hicham.tazi@eidia.ueuromed.org` |
| Student | `imane.saidi@eidia.ueuromed.org` |

All professor and student names used in the demo are fictional.

## Run locally

Requirement: [Node.js LTS](https://nodejs.org).

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Copy `.env.example` to `.env`, then provide your own PostgreSQL connection and a local NextAuth secret.

## How it works

1. An administrator defines the timetable using recurring weekly slots or CSV import, and semester sessions are generated automatically.
2. Each session opens and closes automatically according to the schedule; no manual action is required.
3. Students and professors can mark attendance from a phone using either the **I'm here** flow with GPS/device verification or a rotating QR code.
4. QR tokens are protected with HMAC-SHA256 and rotate every 10 seconds.
5. Anti-fraud checks run on every check-in. Suspicious attendance is flagged for professor review rather than silently rejected.
6. The system provides CSV reports, per-student history, and an anomaly dashboard for administration.

## Operations Research model

The project models attendance verification as a combinatorial optimization problem with binary variables `x_ij ∈ {0,1}` for student `i` attending session `j`.

The multi-criteria objective is:

`Z = α·Z₁ + β·Z₂ + γ·Z₃`

covering attendance coverage, verification quality, and time savings under five constraints:

- uniqueness;
- temporal validity;
- geographic/Haversine validity;
- cryptographic/HMAC validity;
- unique-device checks.

The academic report is available in `report/`.

## Tech stack

Next.js 16 · React 19 · TypeScript · Prisma 6 · PostgreSQL (Neon) · NextAuth · Tailwind CSS v4 · Vercel

## Project structure

| Path | Purpose |
|---|---|
| `src/app/(dashboard)/` | Administrator, professor, student and check-in pages |
| `src/app/api/` | Sessions, attendance, check-in, schedule and analytics APIs |
| `src/lib/qr/` | Rotating HMAC-SHA256 QR tokens |
| `src/lib/geo/` | GPS geofencing using the Haversine formula |
| `src/lib/session-status.ts` | Time-derived session status |
| `src/lib/schedule.ts` | Recurring timetable materialization |
| `prisma/` | Data schema and demo seed |
| `report/` | Academic report generators |

## Highlights

- Recurring schedule generation
- Automatic session state
- GPS-based check-in
- Rotating cryptographic QR tokens
- Professor review workflow
- Attendance history and CSV export
- Administrative anomaly reporting

> This repository contains a university project and uses demonstration data only.
