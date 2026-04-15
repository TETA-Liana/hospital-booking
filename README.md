# City General Hospital — Appointment Booking System

A full-stack hospital appointment booking system: React + Tailwind frontend,
Node/Express + Prisma + PostgreSQL backend, JWT auth with role-based access
control for Admin, Doctor, Receptionist, and Patient users.

## What's implemented

- **Auth**: register, login, logout, refresh tokens, forgot/reset password, change password, argon2 hashing
- **Roles**: SUPER_ADMIN, ADMIN, DOCTOR, RECEPTIONIST, PATIENT — enforced on every protected route
- **Doctors**: CRUD, activation/deactivation, specialties, weekly availability, one-off unavailable dates
- **Booking engine**: real slot generation from doctor working hours minus existing bookings/holidays/leave, with a DB-level unique constraint as the final double-booking guard
- **Appointments**: book, reschedule, cancel, confirm/reject/complete/no-show, check-in, full status history
- **Notifications**: in-app + email (console fallback in dev if SMTP isn't configured)
- **Admin**: dashboard stats, reports (by status/department/doctor, daily trend), audit log, staff management, system settings
- **Frontend**: public site (landing, doctor search, department browse), 4 role-specific dashboards, multi-step booking flow, reschedule modal, availability manager, reports with charts

## Project structure

```
hospital-system/
├── backend/     Express + Prisma API
└── frontend/    React + Vite + Tailwind SPA
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install or Docker)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to point at your Postgres instance, e.g.:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_booking?schema=public"
```

If you don't have Postgres running locally, the quickest option is Docker:

```bash
docker run --name hospital-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hospital_booking -p 5432:5432 -d postgres:16
```

Then run migrations and seed data:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

The API starts on `http://localhost:5000`. Health check: `GET /api/health`.

> **Note on this deliverable:** every backend file was syntax-checked, and the
> Prisma schema was carefully designed and reviewed against the full spec
> (models, relations, indexes, unique constraints for double-booking
> prevention). However, the sandbox this was built in only allows outbound
> network access to a fixed allowlist of domains, and Prisma's engine binaries
> are hosted on `binaries.prisma.sh`, which isn't on that list — so
> `prisma generate` / `migrate` / `seed` could not be executed live during
> development. Run those three commands in your own environment as the first
> thing you do; they should work normally there.

### Seeded accounts (from `prisma/seed.js`)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@hospital.com | Admin@123 |
| Doctor | dr.jane.smith@hospital.com | Doctor@123 |
| Receptionist | reception@hospital.com | Reception@123 |
| Patient | patient@example.com | Patient@123 |

Change the admin credentials via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` before seeding in a real deployment.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app starts on `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000` (see `vite.config.js`). Already verified: `npm run build` completes with zero errors and produces a working production bundle.

## 3. Email (optional for local dev)

If you leave the `SMTP_*` variables in `backend/.env` unset, the notification
service logs emails (password resets, new-account credentials, appointment
notifications) to the backend console instead of sending them — useful for
local development. Fill them in with any SMTP-compatible provider (SendGrid,
Mailgun, Postmark, etc.) to send real emails.

## API overview

All endpoints are prefixed with `/api`. See `backend/src/routes/*.js` for the
full list — auth, doctors (+ availability + slots), departments, specialties,
appointments, patients, staff, notifications, and admin (dashboard/reports/
audit-logs/settings).

Every response follows:

```json
{ "success": true, "message": "...", "data": { ... }, "meta": { ... } }
```

or on failure:

```json
{ "success": false, "message": "...", "errors": [ ... ] }
```

## Business rules enforced in code

1. Patients cannot book a slot the doctor doesn't have available.
2. A doctor cannot be double-booked — enforced both by slot computation and a Prisma `@@unique([doctorId, appointmentDate, startTime])` constraint that survives race conditions.
3. No booking in the past.
4. Completed appointments cannot be cancelled.
5. Only the doctor who owns an availability record (or an admin) can edit it.
6. Only admins/super admins can create or delete doctor accounts.
7. Receptionists can create/manage appointments and patients but cannot manage administrators.
8. Patients can only see/act on their own appointments.
9. Doctors can only see/act on appointments assigned to them.
10. Admins/super admins can access the full system.
11. Deactivated doctors are excluded from booking (`isActive` check before slot generation and on create).
12. Appointment duration is per-doctor and configurable (`appointmentDurationMinutes`).
13. All times are stored as hospital-local wall-clock `HH:mm` strings alongside a plain date, avoiding timezone drift for a single-site facility.
14. Every administrative action (doctor/staff/department created, appointment status changes, settings updates, etc.) is written to `AuditLog`.

## What to review/extend before production

- Add automated tests (unit for slot-generation edge cases; integration for the booking race-condition path)
- Add pagination controls in the frontend tables where lists could grow large
- Wire up a real transactional email provider
- Consider moving appointment reminders to a scheduled job (cron/BullMQ) rather than only booking-time notifications
- Add file upload support for doctor/patient profile photos (currently just a URL field in the schema)
Role	Email	Password
Super Admin	admin@hospital.com	Admin@123
Doctor	dr.jane.smith@hospital.com	Doctor@123
Receptionist	reception@hospital.com	Reception@123
Patient	patient@example.com	Patient@123
