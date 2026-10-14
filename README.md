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

## Phases

0. Setup
1. Login and users ← current
2. Catalog (categories, books, copies, Cyrillic search)
3. Lending, returns, renewals, limits
4. Fines and admin settings
5. Reader portal
6. Reports, audit log, email reminders, launch
