# TransitOps — Smart Transport Operations Platform

A centralized platform to manage the complete lifecycle of transport operations:
vehicle registry, driver management, trip dispatch, maintenance, fuel and expense
tracking, and operational analytics — with role-based access and enforced
business rules.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** ORM with **SQLite** (zero external database to install)
- **Tailwind CSS** for the responsive UI (light + dark mode)
- **Recharts** for analytics
- Cookie-based **JWT** sessions (`jose`) + `bcryptjs`, with **RBAC**

## Getting Started

Requires Node.js 18+.

```bash
npm install
cp .env.example .env      # then set JWT_SECRET
npm run setup             # generate client, create DB, seed demo data
npm run dev               # http://localhost:3000
```

`npm run setup` seeds four demo accounts (password `password123`):

| Role              | Email                   |
| ----------------- | ----------------------- |
| Fleet Manager     | fleet@transitops.com    |
| Driver            | driver@transitops.com   |
| Safety Officer    | safety@transitops.com   |
| Financial Analyst | finance@transitops.com  |

To reset the database at any time: `npm run db:reset`.

## Roles & Permissions

Every authenticated user can read all data. Write access is scoped by role:

| Resource     | Roles that can modify              |
| ------------ | ---------------------------------- |
| Vehicles     | Fleet Manager                      |
| Drivers      | Fleet Manager, Safety Officer      |
| Trips        | Fleet Manager, Driver              |
| Maintenance  | Fleet Manager                      |
| Fuel         | Fleet Manager, Driver              |
| Expenses     | Fleet Manager, Financial Analyst   |

## Enforced Business Rules

All rules are enforced server-side (`src/lib/rules.ts`, API route handlers):

- Vehicle registration number and driver license number are unique.
- Retired or In-Shop vehicles never appear in the dispatch pool.
- Drivers with expired licenses or Suspended status cannot be assigned.
- A vehicle or driver already On Trip cannot be assigned to another trip.
- Cargo weight cannot exceed the vehicle's maximum load capacity.
- Dispatching a trip sets vehicle **and** driver to On Trip.
- Completing a trip restores both to Available and updates the odometer.
- Cancelling a dispatched trip restores both to Available.
- Opening a maintenance log sets the vehicle to In Shop; closing it restores it
  to Available (unless Retired).

Status-changing operations run inside database transactions so vehicle, driver,
and trip state can never drift out of sync.

## Features

- Secure login with role-based access control
- KPI dashboard (active/available vehicles, in maintenance, active/pending
  trips, drivers on duty, fleet utilization) with charts
- CRUD for vehicles and drivers with search, filters, and sorting
- Trip lifecycle: Draft → Dispatched → Completed / Cancelled with validations
- Automatic vehicle/driver status transitions
- Maintenance workflow
- Fuel and expense logging with per-vehicle operational cost
- Reports: fuel efficiency, operational cost, and vehicle ROI
- CSV export for vehicles, drivers, trips, fuel, and expenses
- Responsive UI with dark mode

## Project Structure

```
prisma/            schema + seed
src/
  app/
    (app)/         authenticated pages (dashboard, vehicles, drivers, ...)
    api/           REST route handlers
    login/         login page
  components/      AppShell, UI primitives, user context
  lib/             db, auth, rbac, business rules, constants
```

## Scripts

| Script            | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start dev server                          |
| `npm run build`   | Production build (runs `prisma generate`) |
| `npm run setup`   | Generate client + create DB + seed        |
| `npm run db:seed` | Seed demo data                            |
| `npm run db:reset`| Reset and reseed the database             |
