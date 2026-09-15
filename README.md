# Prestige Jobs MY

A curated board of **prestigious internships and fresh-graduate programmes in Malaysia** — summer internships, management trainee / associate schemes and graduate programmes at top employers across Banking, Consulting, Big 4, FMCG, Big Tech, Oil & Gas and more.

Unlike a general job aggregator, this platform is a deliberately **short, high-quality list**: only the programmes worth a strong student's or fresh grad's time, all in one clean, filterable table — with clear **open now / upcoming / closed** status and links straight to the official application page.

## Features

- **Filterable, sortable table** — search by keyword; filter by industry, role type and status; sort by deadline or company.
- **Status at a glance** — each programme shows *Open now*, *Upcoming* (annual cycle expected to reopen) or *Closed*, computed from its dates. "Closing soon" badges highlight deadlines within 14 days.
- **Admin panel** — password-protected UI to add, edit and delete programmes.
- **Seeded with ~125 real programmes** across all major prestige industries in Malaysia.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Postgres** (via `node-postgres`/`pg`) — works with any Postgres, including free serverless [Neon](https://neon.tech) for hosting on Vercel

## Getting started

You need a Postgres database. The easiest free option is [Neon](https://neon.tech):
create a project and copy its connection string.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   then edit .env.local and paste your Neon DATABASE_URL + set ADMIN_PASSWORD

# 3. Load the curated starter data (~125 programmes)
npm run seed

# 4. Start the app
npm run dev
```

Then open <http://localhost:3000>.

- Public board: `/`
- Admin panel: `/admin`

### Environment variables

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Your Postgres connection string (from Neon). Required. |
| `ADMIN_PASSWORD` | Password for the admin panel. Defaults to `changeme-admin` — **change it before going live.** |

Locally these go in `.env.local`. On Vercel, set them under **Project → Settings → Environment Variables**.

## Deploying to Vercel

See **[DEPLOY.md](./DEPLOY.md)** for beginner-friendly, click-by-click deployment instructions.

## Managing the data

The dates in the seed file are **realistic estimates of annual cycles**, not official confirmations — companies rarely publish next year's exact dates in advance. Use the **Admin panel** to confirm and adjust each programme's open/close dates against the employer's official page. Because statuses are computed from those dates, keeping them current is what keeps the board trustworthy.

To reload the starter data from scratch:

```bash
npm run seed -- --force
```

## Data model

Each programme has: title, company, industry, role type, location, open date, close date, expected-reopen note (for upcoming annual cycles), apply link, eligibility and curator notes. See `lib/types.ts`.

## Roadmap ideas

- Automated refresh of specific high-value sources where feasible
- Email/Telegram alerts when a watched programme opens
- Bookmarking / "my shortlist" for students
- Multi-curator accounts

---

*Prestige Jobs MY is a non-affiliated, curated compilation. Always verify dates and details on the official employer page before applying.*
