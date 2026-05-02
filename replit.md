# Lavanderia Sunrise – Laundry Shop Management System

## Overview
A full-stack laundry shop management system for Lavanderia Sunrise. It handles the complete lifecycle of laundry orders for both staff/owners and customers.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Radix UI / Shadcn UI, Wouter (routing), TanStack Query
- **Backend**: Node.js, Express 5
- **Database**: PostgreSQL via Drizzle ORM
- **Authentication**: Session-based (express-session + connect-pg-simple); PIN login for staff, email/password for customers
- **Email**: Nodemailer with Gmail SMTP (optional – app runs without it)

## Project Structure
```
client/         React frontend (Vite)
  src/
    components/ UI components (Shadcn/UI + business components)
    hooks/      Custom hooks (auth, orders, etc.)
    pages/      Page-level components
server/         Express backend
  index.ts      App entry point, session setup
  routes.ts     All API route definitions
  storage.ts    Database repository layer
  email.ts      Email notification helpers
  db.ts         Drizzle + pg pool setup
  vite.ts       Vite dev middleware setup
shared/         Shared TypeScript types and Zod schemas
script/         Build scripts
```

## Environment Variables
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (provisioned by Replit) |
| `SESSION_SECRET` | Yes | Secret for express-session (provisioned by Replit) |
| `GMAIL_USER` | No | Gmail address for sending emails |
| `GMAIL_PASSWORD` | No | Gmail App Password for SMTP |

## Key Features
1. **Order Management** – Full status workflow: requested → pending → received → washing → drying → folding → ready_for_pickup → completed
2. **Customer Portal** – Registration, login, order tracking, password reset via email
3. **Staff Dashboard** – Role-based (Owner vs Staff), order CRUD, staff management
4. **Services & Promos** – Configurable laundry services and discount codes
5. **Promo Claim with Photo Verification** – Customers upload a proof photo to claim a promo on their active order; staff review, approve (auto-applies discount), or reject from the order details panel. Fields: `promoClaimName`, `promoPhoto` (base64), `promoClaimStatus` on `orders` table.
6. **Reports** – Sales and order reports for owners
7. **Email Notifications** – Order status updates, receipts, price updates, password reset

## Running the App
- **Dev**: `npm run dev` (starts Express + Vite middleware on port 5000)
- **Build**: `npm run build`
- **Production**: `npm start`
- **DB Push**: `npm run db:push`

## Notes
- The app uses a single port (5000) in both dev and production – Vite runs as middleware in dev
- Email features are optional; app logs disabled email actions when credentials are missing
- Session store uses PostgreSQL (connect-pg-simple) – requires DATABASE_URL
