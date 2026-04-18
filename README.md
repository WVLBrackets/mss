# MSS

Greenfield Next.js application built to match [docs/templates/BASE_APP_REQUIREMENTS.md](docs/templates/BASE_APP_REQUIREMENTS.md): strict Google Sheet configuration, NextAuth (credentials + email confirmation outside local dev), Neon Postgres, admin user management, profile + Vercel Blob avatars, and staging/local environment banners.

## Local development

1. Copy `.env.example` to `.env.local` and fill all required variables (Postgres, `NEXTAUTH_SECRET`, Sheet ID/GIDs, SMTP for registration tests without bypass).
2. Run database initialization once: `GET` or `POST` `/api/init-database` with an admin session, **or** set `DATABASE_BOOTSTRAP_SECRET` and send header `x-database-bootstrap-secret`.
3. `npm install` then `npm run dev`.

With `DEV_AUTH_BYPASS=true` and `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` in `.env.local`, sign-in uses the seeded bootstrap user without real credentials (see PRD §9).

## Documentation

- [Project start checklist (MSS status)](docs/MSS_PROJECT_START_CHECKLIST_COMPLETED.md)
- [Template checklist](docs/templates/PROJECT_START_CHECKLIST.md)
- [Iteration log / toolkit improvements](docs/startup/ITERATION_LOG.md)

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
