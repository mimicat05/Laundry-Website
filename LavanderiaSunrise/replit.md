# Lavanderia Sunrise

A laundry service management system for Lavanderia Sunrise in Dacanlao, Calaca, Batangas — covering customer order requests, staff order management, and a customer-facing portal.

## Run & Operate

- `npm run dev` — start development server (port 5000)
- `npm run build` — build for production (client + server bundle)
- `npm run start` — run production build
- `npm run db:push` — push schema changes to the database
- `npm run check` — TypeScript type check

**Required env (auto-set by Replit):** `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

**Optional secrets:** `GMAIL_USER`, `GMAIL_PASSWORD` — enables email notifications. Without these, email is silently disabled (logged to console). `SESSION_SECRET` — defaults to a hardcoded fallback if not set.

## Stack

- **Runtime:** Node.js 20, TypeScript via tsx
- **Frontend:** React 18, Vite 7, Wouter (routing), TanStack Query, Tailwind CSS v3, shadcn/ui (Radix-based)
- **Backend:** Express 5, express-session with connect-pg-simple
- **Database:** PostgreSQL via Drizzle ORM + drizzle-kit
- **Email:** Nodemailer with Gmail SMTP (optional)
- **Auth:** Custom session-based — staff use name+PIN, customers use email+password (bcrypt)

## Where things live

- `client/src/` — React frontend (pages, components, hooks, lib)
- `server/` — Express API (routes.ts, storage.ts, email.ts, db.ts)
- `shared/` — Shared schema (Drizzle + Zod) and typed API routes
- `script/build.ts` — Production build script (esbuild)
- `drizzle.config.ts` — DB config (source of truth for schema location)
- `shared/schema.ts` — Database schema (source of truth)

## Architecture decisions

- Single Express server serves both API (`/api/*`) and the React SPA (Vite middleware in dev, static in prod) on port 5000
- Session stored in PostgreSQL (`connect-pg-simple`) with `createTableIfMissing: true`
- Two separate auth flows share one session: `staffId` for staff, `customerId` for customers
- Email sending is fully optional — gracefully no-ops when GMAIL credentials are absent
- Seed data (default services + admin staff + sample orders) runs at startup if tables are empty

## Product

- **Public landing page** — services, promos, contact info, reviews
- **Customer portal** — register/login, place order requests, track orders, cancel pending orders, claim promos
- **Staff dashboard** — manage orders through status pipeline (requested → pending → received → washing → drying → folding → ready_for_pickup → completed)
- **Owner features** — manage staff (PIN-based), services, promos, shop settings, reports, order logs, recently deleted orders
- **Email notifications** — order confirmations, status updates, receipts, password reset (Gmail SMTP)

## User preferences

_Populate as you build_

## Gotchas

- `/order` redirects unauthenticated customers to `/customer/login` — this is intentional
- Staff login is at `/staff` (not `/staff/login`)
- `trust proxy` is set to `1` for correct IP detection behind Replit's proxy
- Session cookie `secure: true` only in production (required for Replit deployed apps)

## Pointers

- Drizzle schema: `shared/schema.ts`
- API routes: `server/routes.ts`
- Replit DB skill: `.local/skills/database/SKILL.md`
- Replit secrets skill: `.local/skills/environment-secrets/SKILL.md`
