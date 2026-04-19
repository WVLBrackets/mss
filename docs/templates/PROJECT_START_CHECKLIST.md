# New project — setup checklist and runbook

Use this document **every time** you spin up a new application that follows the [BASE_APP_REQUIREMENTS.md](./BASE_APP_REQUIREMENTS.md) template. Check boxes as you complete steps.

---

## Part 1 — Accounts and hosting

### 1.1 Source control

- [ ] Create **GitHub** repository (name, default branch `main`, branch protection optional).
- [ ] Add collaborators and (if org) team access.
- [ ] Initialize from template repo or copy base codebase; push initial commit.

### 1.2 Vercel

- [ ] Create **Vercel** project linked to the GitHub repo.
- [ ] Set **Production** branch to `main` (or your release branch).
- [ ] Confirm **Preview** deployments for PRs / `staging` branch (match team policy).
- [ ] Add project to correct **Vercel team**; note production URL and preview URL pattern.

### 1.3 DNS (if custom domain)

- [ ] Register or point **DNS** to Vercel (A/CNAME per Vercel docs).
- [ ] Set **Production** domain in Vercel; update `NEXTAUTH_URL` after domain is live.

---

## Part 2 — Data and configuration

### 2.1 Neon (PostgreSQL)

- [ ] Create **Neon** project (or two: one prod, one non-prod—recommended).
- [ ] Create branch or database for **production**; copy connection string (pooler URL recommended).
- [ ] Create branch or database for **preview/staging** (and optional **local** dev DB).
- [ ] Store URLs securely—**never** commit to repo:
  - Production → `PRODUCTION_POSTGRES_URL` (or `POSTGRES_URL` on prod Vercel env).
  - Preview/staging → `PREVIEW_POSTGRES_URL` (or `POSTGRES_URL` on preview).
  - Local → `LOCAL_POSTGRES_URL` or `POSTGRES_URL_LOCAL` in `.env.local`.

### 2.2 Google Config Sheet

- [ ] Create a new **Google Sheet** (or duplicate from a blank template).
- [ ] Add tabs named exactly **`PROD`** and **`STAGE`**.
- [ ] Row layout: `parameter` | `value` (header row optional).
- [ ] Populate **all required keys** from BASE_APP_REQUIREMENTS Section 7 on **both** tabs (values can differ per environment).
- [ ] **Publish / share** for CSV export: Sheet must be readable via **public CSV export URL** (same model as WMM: `docs.google.com/spreadsheets/d/{id}/export?format=csv&gid={gid}`).  
  - If you require private sheet + service account later, that is a **template change**—v1 checklist assumes public export like WMM.
- [ ] Record **Spreadsheet ID** and each tab’s **GID** (File → Share → link, or tab-specific URL shows `gid=`).

### 2.3 Google Cloud (optional later)

- [ ] If moving to private Sheets API: create GCP project, enable Sheets API, create service account, download JSON key to **Vercel secret only**—not in Sheet.

### 2.4 Email (transactional)

Pick **one path** below. The base app uses **Nodemailer + SMTP** (`EMAIL_SERVER_*`, `EMAIL_FROM` in Part 3)—no code fork required; only credentials differ.

#### Path A — Custom sending domain (e.g. Resend)

Use when you have (or will add) a **DNS domain you control** so the provider can verify it and you can send from `@yourdomain.com`.

- [ ] Create account with a transactional provider (**Resend**, SendGrid, etc.).
- [ ] **Verify the domain** in the provider (add SPF/DKIM DNS records per their docs).
- [ ] Create API key or SMTP credentials. For **Resend SMTP**: host `smtp.resend.com`, user `resend`, password = API key; ports `587` (STARTTLS, `EMAIL_SERVER_SECURE=false`) or `465` (`EMAIL_SERVER_SECURE=true`). See [Resend SMTP](https://resend.com/docs/send-with-smtp).
- [ ] Set `EMAIL_FROM` to an address on the verified domain (e.g. `My App <noreply@yourdomain.com>`).
- [ ] Add all `EMAIL_SERVER_*` and `EMAIL_FROM` to **Vercel** (Preview + Production) and **`.env.local`** for local tests; redeploy.
- [ ] Send test: **registration confirmation** + **password reset** on Preview, then Production.

#### Path B — No custom domain (v1): Gmail SMTP

Use when the app only has **Vercel default hostnames** and you do **not** yet have a verified domain at Resend (you **cannot** use an arbitrary `@gmail.com` as the From address **through** Resend; use Gmail’s own SMTP instead).

- [ ] Create or designate a **dedicated Gmail** inbox for the app (keeps app mail separate from personal mail).
- [ ] On that Google Account: enable **2-Step Verification** — [Google Account → Security](https://myaccount.google.com/security).
- [ ] Create an **App password**: [App passwords](https://myaccount.google.com/apppasswords) (or [Google Help](https://support.google.com/accounts/answer/185833)). Choose app **Mail** / device **Other** (e.g. `Vercel`). Store the **16-character** value as **`EMAIL_SERVER_PASSWORD`** — **not** the normal Gmail password.
- [ ] Set in **Vercel** and **`.env.local`**:
  - `EMAIL_SERVER_HOST` = `smtp.gmail.com`
  - `EMAIL_SERVER_PORT` = `587`
  - `EMAIL_SERVER_SECURE` = `false`
  - `EMAIL_SERVER_USER` = full Gmail address
  - `EMAIL_SERVER_PASSWORD` = App password from above
  - `EMAIL_FROM` = same address, or `Display Name <address@gmail.com>`
- [ ] **Redeploy** after saving variables.
- [ ] Send test: **registration confirmation** + **password reset** on Preview, then Production.

**Troubleshooting — Preview says `EMAIL_SERVER_HOST is required` but Vercel shows “All Environments”:** Vercel **Sensitive** env values are not available during `next build`; some Next.js builds can treat `process.env.FOO` as empty at compile time—use **runtime bracket reads** (e.g. `process.env["EMAIL_SERVER_HOST"]` via a local `const env = process.env`) in the mail module so Preview matches Production. Also check that no variable is restricted to a **single Git branch** that excludes your staging branch.

---

## Part 3 — Environment variables matrix

Set in **Vercel → Project → Settings → Environment Variables** (scope Production vs Preview vs Development) and in **`.env.local`** for local.

| Variable | Production | Preview / Staging | Local (`.env.local`) |
|----------|------------|-------------------|----------------------|
| `NEXTAUTH_URL` | `https://your-prod-domain` | Vercel preview URL or staging URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Strong random | Strong random (can differ) | Strong random |
| `PRODUCTION_POSTGRES_URL` | Neon prod URL | — | — |
| `PREVIEW_POSTGRES_URL` | — | Neon preview URL | — |
| `POSTGRES_URL` | Sometimes used as alias | Sometimes Vercel default | Optional |
| `LOCAL_POSTGRES_URL` | — | — | Neon/local Postgres URL |
| `SITE_CONFIG_SHEET_ID` | Same sheet ID | Same sheet ID | Same sheet ID |
| `SITE_CONFIG_GID_PROD` | GID of `PROD` tab | — | — |
| `SITE_CONFIG_GID_STAGE` | — | GID of `STAGE` tab | GID of `STAGE` tab |
| `VERCEL_ENV` | Set by Vercel | Set by Vercel | — |
| `NODE_ENV` | `production` | `production` | `development` |
| `APP_ENV` | `production` or unset | `preview` or `staging` | `local` |
| `DEV_AUTH_BYPASS` | **unset / false** | **unset / false** | `true` for local fake login |
| `DEV_AUTH_EMAIL` | — | — | `wvanderlaan@gmail.com` (optional) |
| `BLOB_READ_WRITE_TOKEN` | If using Vercel Blob | Preview token or shared | Dev token |
| `DATABASE_BOOTSTRAP_SECRET` | _(Optional)_ One-time init secret for `x-database-bootstrap-secret` on `/api/init-database` | Same or unset | Same or unset |
| `NEXT_PUBLIC_DEV_AUTH_BYPASS` | **unset / false** | **unset / false** | `true` when `DEV_AUTH_BYPASS=true` so the sign-in UI can show local-dev copy |

**Optional (legacy / extra admin):**

| Variable | Notes |
|----------|--------|
| `ADMIN_EMAIL` | Not required if PRD bootstrap + DB-only admins; add if you want env-listed second admin |
| `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_SERVER_SECURE`, `EMAIL_FROM` | Transactional SMTP (**§2.4**). Same variable names for Path A (Resend + verified domain) or Path B (Gmail + App Password); scope Preview vs Production in Vercel; mirror in `.env.local` for local. |

**Secrets checklist:** no secrets in Config Sheet; no secrets in client-exposed `NEXT_PUBLIC_*` except documented public keys.

---

## Part 4 — Recommended order of operations

1. **Repo** created; base code pushed.
2. **Neon** URLs created; **Vercel** project linked.
3. Set **Vercel env vars** for Preview first (smallest blast radius).
4. **Config Sheet** created; PROD + STAGE rows filled; GIDs in env.
5. Deploy **preview**; run **`/api/init-database`** as admin (or run migrations) against preview DB.
6. **Smoke test** preview: Config loads, banner shows “Staging”, sign-in or dev flow, admin users.
7. Set **Production** env vars; deploy **production**.
8. Run **init-database** (or migrations) on **production** DB.
9. **Smoke test** production: no banner, auth, admin, health.
10. Document URLs and env in team **password manager** or internal wiki.

---

## Part 5 — Ongoing per release

- [ ] Before promoting to prod: `npm run build` and lint clean locally or in CI.
- [ ] After Config Sheet change: verify CSV export cache bust if issues (see PRD).
- [ ] After schema change: run migration / init path on staging before prod.

---

## Part 6 — Handoff to build agent

1. Attach **BASE_APP_REQUIREMENTS.md** as the authoritative spec.
2. Attach this checklist filled or partially filled for **env-specific values** (sheet ID, GIDs, URLs—redact secrets in shared docs).
3. State **repository URL** and **Vercel project** name in the handoff message.

---

*End of checklist.*
