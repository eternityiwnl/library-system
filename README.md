# Номын сангийн удирдлагын систем

Library management system for a real library: books, categories, readers, home lending and returns, late fines.
Mongolian-only UI. Deployed on Vercel.

## Stack

- Next.js (App Router, TypeScript) — pages + backend (Server Actions, Route Handlers) in one app
- Postgres on Neon (via Vercel Marketplace), Drizzle ORM
- Better Auth (roles: admin / librarian / reader; readers are registered by librarians)
- Zod, Tailwind CSS
- Vercel Cron + Resend for overdue email reminders

## Layout

```
src/app/        pages and routes
src/db/         schema.ts (tables), auth-schema.ts (Better Auth tables), index.ts (db client)
src/lib/        auth.ts (Better Auth config), session.ts (requireUser/requireRole), users.ts
scripts/        create-admin.mts
drizzle/        generated SQL migrations — commit these
```

## Setup

1. `npm install`
2. `npx vercel@64.0.2 env pull .env.local` (project is linked to Vercel team `nity2`), then add a
   `BETTER_AUTH_SECRET` line — see `.env.example`
3. `npm run db:migrate`
4. `npm run dev`

**Dev and production share one Neon database.** Anything created locally is live.

## First admin

```
npm run create-admin
```

Asks for name, email and password (hidden). Everyone else is created from the app:
admins create librarians, librarians create readers. New accounts get a one-time
password and must change it on first login.

## Auth notes

- Readers log in with card number (Better Auth `username`), staff with email.
- Readers without email get a placeholder `<card>@no-email.invalid` (Better Auth requires email).
- Self sign-up and self-edit endpoints are disabled in `src/lib/auth.ts` (`disabledPaths`).
- Every page and Server Action checks the role itself via `requireRole` in `src/lib/session.ts`.
- Allowed hosts for auth are listed in `src/lib/auth.ts` — add a custom domain there.

## Database changes

Edit `src/db/schema.ts`, then:

```
npm run db:generate -- --name <what-changed>
npm run db:migrate
```

`npm run db:studio` opens a browser view of the data.

## Demo data

```
npm run demo:seed    # ~34 books, 25 readers, a year of loans and fines
npm run demo:clear   # removes only what demo:seed created
```

Demo logins are written to `.demo-credentials.txt` (git-ignored). Every row the seed creates is
listed in the `demo_records` table; `demo:clear` deletes exactly those.

## Email reminders

Vercel Cron calls `/api/cron/reminders` daily at 01:00 UTC (09:00 Ulaanbaatar), protected by
`CRON_SECRET`. Readers get one email for loans due tomorrow and for overdue loans (day 1, then
every 7 days); `reminder_log` keeps it to once per loan per day. Admins can also send from
**Имэйл сануулга**. Env: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REDIRECT_TO` (see `.env.example`).
Without a verified domain Resend only delivers to the account owner, so set `EMAIL_REDIRECT_TO`
to that address and every reminder goes there with the real recipient in the subject.

## Phases

0. Setup
1. Login and users
2. Catalog (categories, books, copies, Cyrillic search)
3. Lending, returns, renewals, limits
4. Fines and admin settings
5. Reader portal (public catalog at /catalog, reader page at /me)
6. Activity log, reports, email reminders, demo data
