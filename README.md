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
src/db/         schema.ts (tables) and index.ts (db client, server-only)
drizzle/        generated SQL migrations — commit these
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Neon connection strings
   (or `vercel env pull .env.local` once the project is linked)
3. `npm run db:migrate`
4. `npm run dev`

## Database changes

Edit `src/db/schema.ts`, then:

```
npm run db:generate -- --name <what-changed>
npm run db:migrate
```

`npm run db:studio` opens a browser view of the data.

## Phases

0. Setup ← current
1. Login and users
2. Catalog (categories, books, copies, Cyrillic search)
3. Lending, returns, renewals, limits
4. Fines and admin settings
5. Reader portal
6. Reports, audit log, email reminders, launch
