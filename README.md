# Clip Catchers — Client Dashboard

Authenticated client dashboard for brands running campaigns with Clip Catchers.
Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Framer Motion · Prisma · PostgreSQL · Auth.js.

Dark mode is the default; a light theme ships with it.

---

## Quick start (local)

```bash
npm install --legacy-peer-deps
cp .env.example .env          # fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate deploy     # creates every table
npm run db:seed               # demo account + campaigns, invoices, tickets
npm run dev                   # http://localhost:3000
```

Seed credentials (override with `SEED_EMAIL` / `SEED_PASSWORD`):

```
demo@clipcatchers.com  ·  ClipCatchers!2026
```

Generate a session secret with `openssl rand -base64 32`.

---

## Deploying to Railway

1. **Push this folder to its own GitHub repo.**
2. **New Project → Deploy from GitHub repo** and select it. The `Dockerfile` and
   `railway.json` are picked up automatically — migrations run on every boot via
   `prisma migrate deploy`.
3. **Add a PostgreSQL service** (`+ New → Database → PostgreSQL`).
4. **Variables** on the app service:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `AUTH_SECRET` | 32-byte random string |
   | `AUTH_URL` | `https://<your-app>.up.railway.app` |
   | `NEXT_PUBLIC_APP_URL` | same as `AUTH_URL` |
   | `AUTH_TRUST_HOST` | `1` |
   | `UPLOAD_DIR` | `/data/uploads` |

5. **Attach a volume** at `/data` so uploaded assets survive redeploys.
6. **Settings → Networking → Generate Domain**, then set `AUTH_URL` /
   `NEXT_PUBLIC_APP_URL` to that domain and redeploy.
7. Optional: seed the deployed database with `railway run npm run db:seed`.

Health check: `GET /api/health` returns `200` when the database is reachable and
`503` when it isn't (wired into `railway.json`).

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Session signing key |
| `AUTH_URL`, `NEXT_PUBLIC_APP_URL` | ✅ in prod | Public origin, no trailing slash |
| `AUTH_TRUST_HOST` | ✅ on Railway | Trust the proxy's forwarded host |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | — | Verification + reset emails. **Without SMTP the app prints the link to the server console and shows it in the UI**, so both flows still work end to end. |
| `UPLOAD_DIR` | — | Defaults to `./uploads` |
| `MAX_UPLOAD_MB` | — | Defaults to `50` |
| `STRIPE_SECRET_KEY` etc. | — | Billing works without it (plan changes + invoices are recorded directly); with a key set, `PATCH /api/billing` is where you'd return a Checkout URL — the client already redirects to `checkoutUrl` when present. |

---

## What's in here

**Auth** — email + password sign-up, email verification, login, forgot/reset
password, JWT sessions, role field on every user (`CLIENT` / `ADMIN`) enforced by
`requireRole()`. Middleware guards every page; API routes answer with JSON `401`.

**Dashboard** — greeting, four animated stat cards (count-up on scroll into
view), 30-day views/reach area chart, campaign status breakdown, budget meter,
merged activity feed, quick actions, upcoming dates.

**Campaigns** — searchable, filterable, paginated grid; detail view with delivery
chart, budget, schedule, brief and attached assets; edit form; view / edit /
pause / resume / cancel with a confirmation dialog. Status transitions are
validated server-side, not just hidden in the UI.

**Create campaign** — 7-step wizard (brand → logo → assets → details → budget →
review → submit) with per-step validation, drag-and-drop uploads and animated
transitions.

**Analytics** — range picker (7/30/90/365 days), views & reach, daily/weekly/
monthly growth tabs, CPM over time, per-campaign performance table.

**Files** — drag-and-drop upload, type filters, search, image previews,
authenticated download/delete. Files are streamed through an API route that
checks ownership; storage keys are UUIDs, never user-supplied paths.

**Billing** — plan cards with upgrade/downgrade, invoice table, payment methods,
outstanding/paid totals. Stripe-ready.

**Support** — ticket list, threaded conversation, replies (⌘↵ to send),
attachments, mark resolved. A client reply reopens a resolved thread.

**Notifications** — dropdown in the top bar with unread badge, full page with
all/unread filters, mark-all-read and clear-read.

**Settings** — profile (with avatar upload), email change (password-confirmed),
password change, notification preferences.

**Throughout** — command palette (`⌘K`), `g`-chord shortcuts (`g d`, `g c`, `g a`
…, `?` lists them), skeleton loading states, empty states, toasts, responsive
layout with a mobile sidebar, theme toggle.

---

## Project structure

```
prisma/
  schema.prisma          User, Settings, VerificationToken, Campaign,
                         CampaignMetric, Invoice, PaymentMethod, Notification,
                         FileAsset, SupportTicket, TicketMessage
  migrations/            initial SQL migration
  seed.ts                demo workspace
src/
  auth.ts                Auth.js config (credentials provider)
  auth.config.ts         edge-safe half, used by middleware
  middleware.ts          route protection
  app/
    (auth)/              login, signup, forgot/reset password, verify email
    (dashboard)/         dashboard, campaigns, analytics, billing, files,
                         notifications, support, settings
    api/                 auth, campaigns, analytics, files, upload,
                         notifications, tickets, billing, settings, search, health
  components/
    ui/                  shadcn/ui primitives
    layout/              sidebar, topbar, search, notifications, shortcuts
    campaigns/ charts/ dashboard/ files/ billing/ support/ settings/ notifications/
  lib/                   prisma, auth helpers, queries, validations, storage,
                         mail, tokens, formatting, constants
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration |
| `npm run db:seed` | Seed the demo workspace |
