# Startup toolkit — iteration log (MSS)

Lessons from the MSS greenfield pass to improve the next project kickoff.

## Tooling and scaffolding

1. **npm package name vs folder name:** `create-next-app` in a folder named `MSS` failed because npm disallows uppercase package names. Scaffold in a lowercase directory (for example `mss-scaffold`) and move into the project folder, then set `"name": "mss"` in `package.json`.
2. **Tailwind 4:** Default `create-next-app` still pulled Tailwind 3; upgrade to `tailwindcss@4` with `@tailwindcss/postcss` and `@import "tailwindcss"` in global CSS. Remove the default `tailwind.config.ts` when using CSS-first v4 setup.
3. **Neon / Postgres client:** `@vercel/postgres` is deprecated for new projects. MSS uses `@neondatabase/serverless` with the same tagged-template pattern and explicit URLs from `LOCAL_POSTGRES_URL` / `PREVIEW_POSTGRES_URL` / `PRODUCTION_POSTGRES_URL`. Consider updating GLOBAL_ENGINEERING_STANDARDS §1.4 to mention Neon’s first-party driver alongside the portfolio SQL style.
4. **Next.js security advisories:** Pin Next to a patched 15.x line and re-run `npm audit` after scaffold.

## Checklist and operations

5. **First DB migration without an admin session:** `/api/init-database` supports an optional `DATABASE_BOOTSTRAP_SECRET` header so the first migration can be run before any user exists (document in checklist env matrix).
6. **Public site config for auth pages:** Auth UI needs welcome copy from the Config Sheet without duplicating keys in code. MSS exposes `GET /api/site-config` for non-secret keys only; consider adding this to BASE_APP_REQUIREMENTS as an optional pattern.

## Suggested template doc edits

- Add `DATABASE_BOOTSTRAP_SECRET` and `EMAIL_SERVER_*` / `EMAIL_FROM` to [PROJECT_START_CHECKLIST.md](../templates/PROJECT_START_CHECKLIST.md) Part 3 table.
- Add `NEXT_PUBLIC_DEV_AUTH_BYPASS` (and optional `NEXT_PUBLIC_DEV_AUTH_EMAIL`) where local UI should mirror `DEV_AUTH_BYPASS`.
- Clarify CSV parsing for Config Sheet values that contain commas (quote handling or “no commas in values” rule).
