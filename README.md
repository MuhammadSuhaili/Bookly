# Bookly — Booking Management System

A modern booking platform built with **Next.js** to discover services, schedule appointments, and manage reservations. Supports customers and administrators with full booking lifecycle management.

## Features

- **Service catalog** — browse services by category, with premium images, pricing, ratings, and availability.
- **Online booking** — pick a date and an available time slot, then confirm with customer details.
- **Customer account** — dashboard, booking history, booking details, and cancellation.
- **Admin dashboard** — manage services, categories, schedules & time slots, bookings, reports, and audit logs.
- **Role-based auth** — customer vs. admin access with session-based security.
- **Responsive UI** — comfortable on mobile, tablet, and desktop (teal theme, mobile navigation, and drawer-based admin sidebar).
- **Indonesian locale** — prices displayed in Rupiah (IDR), e.g. Rp 250.000.

## Tech Stack

- **Next.js** (App Router)
- **Drizzle ORM** + **PostgreSQL** (Neon)
- **Tailwind CSS**
- **TypeScript**

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

| Variable               | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string (e.g. Neon)           |
| `AUTH_SECRET`          | Random secret used to sign session cookies         |
| `NEXT_PUBLIC_APP_URL`  | Public base URL (e.g. `http://localhost:3000`)      |
| `APP_ENV`              | `development` \| `production`                      |

### 3. Set up the database

Generate and run migrations, then seed sample data:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

After seeding, you can log in with:

| Role    | Email                  | Password     |
| ------- | ---------------------- | ------------ |
| Admin   | `admin@booking.app`    | `Password123!` |
| Customer| `customer@booking.app` | `Password123!` |

## Scripts

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the development server          |
| `npm run build`     | Build the production bundle           |
| `npm run start`     | Start the production server           |
| `npm run lint`      | Run ESLint                            |
| `npm run typecheck` | Run TypeScript type checking          |
| `npm run db:generate` | Generate Drizzle migrations        |
| `npm run db:migrate`  | Apply Drizzle migrations           |
| `npm run db:seed`     | Seed the database with sample data  |
