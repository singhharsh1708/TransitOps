# TransitOps

Logistics teams still run their fleets out of spreadsheets and paper logbooks.
The result is the usual mess: two trips booked on the same truck, a driver sent
out on an expired licence, maintenance that slips, and no honest picture of what
any vehicle actually costs to run.

TransitOps replaces that with one place to manage the whole operation — register
vehicles and drivers, dispatch trips, log fuel and maintenance, and see the cost
and utilisation numbers fall out the other end. It was built for the Odoo
Hackathon '26 against the TransitOps problem statement.

**Live:** https://transitops-two.vercel.app — sign in with any of the demo
accounts on the login screen (they're all `password123`).

## How it's built

It's a single Next.js 14 app (App Router, TypeScript) — the API routes and the
UI live in the same codebase, so there's nothing to wire together. Data sits in
PostgreSQL through Prisma; on Vercel that's a Neon serverless database, and
locally it's the same connection string. Auth is a signed JWT in an httpOnly
cookie (`jose` + `bcryptjs`), and the middleware turns anyone away from the app
or the API until they're logged in. The UI is Tailwind with Recharts for the
graphs, and it works in light and dark.

## Running it locally

You'll need Node 18+ and a Postgres database. A free Neon project is the quickest
way to get one.

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
npm run setup              # generates the client, creates the tables, seeds data
npm run dev                # http://localhost:3000
```

`DATABASE_URL` is the pooled connection string the app uses at runtime;
`DIRECT_URL` is the direct one Prisma needs when it changes the schema. `npm run
setup` also loads a set of sample vehicles, drivers and trips plus four login
accounts — one per role — so the dashboard isn't empty on first run:

| Role              | Email                  |
| ----------------- | ---------------------- |
| Fleet Manager     | fleet@transitops.com   |
| Driver            | driver@transitops.com  |
| Safety Officer    | safety@transitops.com  |
| Financial Analyst | finance@transitops.com |

`npm run db:reset` wipes and reseeds if you want a clean slate.

## Who can do what

The four roles come straight from the problem statement, and each one only gets
write access to the part of the system it owns. Everyone can read everything;
the restrictions are on changes:

- **Fleet Manager** runs the fleet — the only role that edits vehicles and opens
  or closes maintenance.
- **Driver** creates and dispatches trips and logs fuel. (The problem statement
  is explicit that the driver creates trips and assigns the vehicle and driver;
  the organisers confirmed the PDF is the source of truth over the mock-up, so
  there is no separate "dispatcher" role here.)
- **Safety Officer** manages driver records — licences, safety scores, status.
- **Financial Analyst** records expenses.

## The rules that actually matter

The point of the app is that the bad states are unreachable, so every rule is
enforced on the server (`src/lib/rules.ts` and the API handlers), not just hidden
in the UI:

- Registration numbers and licence numbers are unique.
- A vehicle that's retired or in the shop never shows up when you go to dispatch,
  and neither does a driver who's suspended or whose licence has expired.
- Nothing already on a trip can be booked onto a second one.
- Cargo can't exceed the vehicle's rated load.
- Dispatching flips both the vehicle and the driver to *On Trip*; completing the
  trip puts them back to *Available* and rolls the odometer forward; cancelling
  a dispatched trip releases them again.
- Opening a maintenance log moves the vehicle to *In Shop* and out of the
  dispatch pool; closing it brings the vehicle back.

Anything that touches two records at once — a dispatch, a completion, a
maintenance open — runs in a database transaction, so a trip can never end up
pointing at a vehicle whose status disagrees with it.

## What's in the box

Login and role-based access, a KPI dashboard with utilisation gauges and cost
charts, full CRUD for vehicles and drivers with search and filters, the trip
lifecycle (Draft → Dispatched → Completed/Cancelled) with all the validations
above, the maintenance workflow, fuel and expense logging, and a reports view
with fuel efficiency, operational cost, and vehicle ROI. Every table exports to
CSV. The ROI figure follows the formula given in the problem statement —
`(revenue − (maintenance + fuel)) / acquisition cost`.

## Layout

```
prisma/            schema and seed script
src/
  app/
    (app)/         the signed-in pages: dashboard, vehicles, drivers, trips, ...
    api/           REST endpoints, one folder per resource
    login/         the login screen
  components/      app shell, shared UI pieces, icons
  lib/             db client, auth, business rules, constants
```

## Scripts

`npm run dev` for development, `npm run build` for a production build (it
generates the Prisma client and pushes the schema first), `npm run setup` for a
fresh install, and `npm run db:reset` to reseed.
