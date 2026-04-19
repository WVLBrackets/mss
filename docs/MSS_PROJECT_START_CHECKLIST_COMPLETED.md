# MSS — project start checklist (status copy)

This is a **working copy** of [docs/templates/PROJECT_START_CHECKLIST.md](templates/PROJECT_START_CHECKLIST.md) for the MSS rollout. Check boxes as you finish each step; secrets and connection strings stay in Vercel and `.env.local` only.

| Field | Value (fill in) |
|--------|-------------------|
| GitHub repository | https://github.com/WVLBrackets/mss |
| Vercel project name | `mss` (dashboard); production host `mss-umber.vercel.app` |
| Production URL | https://mss-umber.vercel.app |
| Preview URL pattern | Unique URL per deployment (see **Deployments** in Vercel; often `mss-git-<branch>-<org>.vercel.app` style for PRs) |
| Transactional email (v1) | **Path B — Gmail SMTP** ([template §2.4 Path B](templates/PROJECT_START_CHECKLIST.md#24-email-transactional)): dedicated inbox **`mystudioscheduler@gmail.com`**, Google **2-Step Verification** + **App Password** → `EMAIL_SERVER_*` / `EMAIL_FROM` in Vercel (Preview + Production) and `.env.local`. No custom domain / Resend for v1. |
| Neon project | _pending_ |
| Config Sheet ID | _pending_ |
| Tab `PROD` GID | _pending_ |
| Tab `STAGE` GID | _pending_ |

---

## Part 1 — Accounts and hosting

### 1.1 Source control

- [x] Create **GitHub** repository (suggested package name: `mss`; default branch `main`).
- [ ] Add collaborators and (if org) team access. _(Skip if solo.)_
- [x] **Application codebase** ready in this workspace (Next.js 15 + BASE shell). Push initial commit after the remote exists.

#### How to — create the GitHub repository (beginner walkthrough)

1. **Open GitHub in your browser**  
   Go to [https://github.com](https://github.com) and sign in. If you do not have an account yet, click **Sign up**, create a free account, and verify your email when GitHub sends a message.

2. **Start the “new repository” flow**  
   While logged in, click the **+** icon in the top-right corner, then click **New repository**.  
   (Alternatively: [https://github.com/new](https://github.com/new).)

3. **Fill in the repository settings**  
   - **Owner:** Choose yourself (or your organization if you use GitHub for work).  
   - **Repository name:** Use `mss` (all lowercase is conventional and matches the app’s `package.json` name).  
   - **Description:** Optional; e.g. “MSS web application.”  
   - **Visibility:** **Public** is fine for many projects; **Private** if you want the code visible only to you and invited collaborators.  
   - **Initialize:** Leave **Add a README**, **Add .gitignore**, and **Choose a license** **unchecked** — your computer already has a full MSS project with its own `.gitignore` and files. Adding a README on GitHub would create an extra commit you would have to merge.  
   Click **Create repository**.

4. **Copy the repository URL**  
   After creation, GitHub shows a page titled something like “…or push an existing repository from the command line.” Find the HTTPS URL, which looks like `https://github.com/YOUR_USERNAME/mss.git`. Copy it; you will use it in the next step.

5. **Connect your existing project and push (on your PC)**  
   Open **PowerShell** or **Terminal**, go to your project folder, add GitHub as `origin`, and push:

   ```powershell
   cd "c:\Users\wvand\CursorProjects\MSS"
   git remote add origin https://github.com/YOUR_USERNAME/mss.git
   git branch -M main
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username. If `git remote add origin` says the remote already exists, use:

   ```powershell
   git remote set-url origin https://github.com/YOUR_USERNAME/mss.git
   ```

   The first time you push, GitHub may open a **login** window or ask for a **Personal Access Token** instead of a password (GitHub no longer accepts account passwords for Git over HTTPS). If prompted, follow GitHub’s “Device login” or create a token under **Settings → Developer settings → Personal access tokens** with **repo** scope.

6. **Confirm on GitHub**  
   Refresh your repository page in the browser. You should see your files (`src`, `package.json`, `docs`, etc.) and the latest commit on branch **main**.

7. **Collaborators (optional)**  
   If others need access: on the repo page go **Settings → Collaborators** (or **Manage access**), and invite people by GitHub username or email.

When steps 1–6 are done, check the boxes above for **1.1** (except collaborators if you are solo), paste your repo URL into the table at the top of this file, and we can move on to **Vercel (1.2)**.

### 1.2 Vercel

- [x] Create **Vercel** project linked to the GitHub repo.
- [x] Set **Production** branch to `main` (or your release branch).
- [x] Confirm **Preview** deployments for PRs / `staging` branch (match team policy).
- [x] Add project to correct **Vercel team**; note production URL and preview URL pattern.

**Production `NEXTAUTH_URL` (set when you add env vars):** `https://mss-umber.vercel.app` (no trailing slash is conventional; either works if consistent everywhere).

#### How to — create the Vercel project (beginner walkthrough)

**What Vercel is:** A hosting service built for frontend frameworks like Next.js. It watches your GitHub repo, **builds** your app on every push, and gives you a **URL** for production and optional **preview URLs** for branches or pull requests. You configure secrets (database URLs, auth secrets) in the Vercel dashboard, not in GitHub.

1. **Open Vercel and sign in**  
   Go to [https://vercel.com](https://vercel.com). Sign up or sign in. Choosing **Continue with GitHub** is easiest so Vercel can read your repositories.

2. **Import the MSS repository**  
   From the Vercel dashboard, click **Add New…** → **Project** (or **Import Project** / **Add…** depending on the UI).  
   You should see a list of GitHub repositories. If you see nothing, click **Adjust GitHub App Permissions** or **Configure GitHub App** and grant access to **All repositories** or at least **`WVLBrackets/mss`**, then return and refresh the list.

3. **Select the repo**  
   Find **`mss`** under the **`WVLBrackets`** account and click **Import**.

4. **Configure the project (defaults are usually correct)**  
   - **Project name:** `mss` (or another name; this only affects the default URL prefix, e.g. `mss-xxx.vercel.app`).  
   - **Framework Preset:** Should auto-detect **Next.js**. Leave it.  
   - **Root Directory:** Leave **empty** (repository root), unless your app lived in a subfolder.  
   - **Build Command:** Leave default (`npm run build` or `next build` as offered).  
   - **Output Directory:** Leave default for Next.js (Vercel fills this in).  
   - **Install Command:** Leave default (`npm install` or `pnpm install` as applicable).

5. **Environment variables (first pass)**  
   For MSS, the app needs database, auth, and Config Sheet variables to run **correctly** in the browser (see Part 3 and Part 2 of this checklist). It is still fine to click **Deploy** now to confirm that **Vercel ↔ GitHub** and the **build** work; the live site may show a **configuration error** until those variables and Neon/Sheet exist. You can also skip deploying until after Neon + Sheet and add env first—either path is acceptable. We will add the full env matrix in a later step together.

6. **Deploy**  
   Click **Deploy**. Wait for the build log to finish. A green check means the build succeeded.

7. **Find your URLs**  
   After deploy, Vercel shows **Visit** and your **Production** URL (e.g. `https://mss-xxxxx.vercel.app` or `https://mss.vercel.app` depending on name availability). Open **Project → Settings → Domains** to see the production domain. **Preview** deployments (other branches or pull requests) get their own URLs like `https://mss-git-branch-user.vercel.app`; each deployment’s URL appears on that deployment’s page.

8. **Production branch = `main`**  
   Go **Project → Settings → Git**. Confirm **Production Branch** is **`main`** (Vercel usually sets this automatically for a new repo whose default branch is `main`).

9. **Preview deployments**  
   On the Hobby (free) plan, **Preview** deployments for **pull requests** and non-production branches are typically **on** by default. Under **Settings → Git**, review **Ignored Build Step** or branch filters if your team uses a custom policy. For solo work, defaults are usually enough.

10. **Team**  
    If you use a **Vercel Team** (company), pick the right team when importing; otherwise your **Personal** account team is fine. Note which team owns the project for billing and access.

When you have finished steps 1–8 (and 9–10 as applicable), check the **1.2** boxes above and fill the **Vercel project name**, **Production URL**, and **Preview URL pattern** rows in the table at the top of this file.

### 1.3 DNS (if custom domain)

- [ ] _(Optional for v1)_ Register or point **DNS** to Vercel.
- [ ] Set **Production** domain in Vercel; update `NEXTAUTH_URL` after domain is live.

---

## Part 2 — Data and configuration

### 2.1 Neon (PostgreSQL)

- [ ] Create **Neon** project (prod + non-prod recommended).
- [ ] Copy pooler URLs into Vercel env: `PRODUCTION_POSTGRES_URL`, `PREVIEW_POSTGRES_URL`, and `LOCAL_POSTGRES_URL` in `.env.local`.

#### How to — Neon (beginner walkthrough)

**What Neon is:** A hosted **PostgreSQL** database in the cloud. MSS stores users and sessions there. Vercel runs your **serverless** functions; they connect to Neon over the network using a **connection string** (a URL that includes user, password, host, and database name).

1. **Sign up**  
   Go to [https://neon.tech](https://neon.tech) and create an account (GitHub login is fine).

2. **Create a project**  
   Click **Create project**. Pick a name (e.g. `mss`), choose a **region** close to your users or to Vercel (e.g. **AWS US East** if your Vercel builds run in `iad1`). Create the project.

3. **Understand branches**  
   Neon starts with a default **branch** (often `main`) and a **database** on that branch. For MSS you want **two isolated databases** (or two branches): one for **production** traffic and one for **preview** / non-prod so test data never shares tables with live data.

4. **Create a second branch for preview**  
   In the Neon console, open your project → **Branches** → **Create branch**. Name it e.g. `preview`, parent **main** (or your default). Neon creates a **separate** database state for that branch.

5. **Get connection strings (use the pooler)**  
   For **each** branch (`main` = prod, `preview` = preview):

   - Open **Dashboard** → your project → **Branches** → select the branch.  
   - Find **Connection details** (or **Connect**).  
   - Choose **Connection pooling** (often labeled **Pooled** or “Serverless driver”) — important for Vercel serverless so you do not exhaust connections.  
   - Copy the **connection string** (starts with `postgresql://` or `postgres://`).  
   - Treat these as **secrets** — never paste them into GitHub or the Config Sheet.

6. **Where each string goes**

   | Neon branch | Vercel variable | Vercel environment scope |
   |-------------|-----------------|---------------------------|
   | `main` (production) | `PRODUCTION_POSTGRES_URL` | **Production** only |
   | `preview` (or your non-prod branch) | `PREVIEW_POSTGRES_URL` | **Preview** (and optionally **Development** if you use Vercel CLI env) |
   | Same as preview, or a dedicated local branch | `LOCAL_POSTGRES_URL` | Your PC only — in **`.env.local`**, not in Git |

7. **Add variables in Vercel**  
   Vercel project → **Settings** → **Environment Variables**. Add `PRODUCTION_POSTGRES_URL` scoped to **Production**. Add `PREVIEW_POSTGRES_URL` scoped to **Preview** (and **Development** if you want). Use **Save**, then **Redeploy** (or push a commit) so new builds pick them up.

When Neon is wired, fill the **Neon project** row in the table at the top of this file (project name in Neon console; no secrets in that table).

#### If Neon says “create project through Vercel” (Vercel-managed Neon)

Neon may **disable** “New project” when your account is tied to **Vercel-managed** billing. That is normal. Create and connect the database **from Vercel** instead:

1. Open the **[Neon integration on the Vercel Marketplace](https://vercel.com/marketplace/neon)** and click **Install** (or in the Vercel dashboard go **Storage** / **Integrations** and add **Neon** — labels vary).
2. Follow the wizard: accept terms, pick **region** and plan, name the database (this becomes a **Neon project**).
3. **Connect to your app:** choose Vercel project **`mss`** and which environments get database variables (**Production**, **Preview**, **Development** as you prefer). See Neon’s walkthrough: [Vercel-Managed Integration](https://neon.com/docs/guides/vercel-managed-integration).
4. **Optional but useful:** enable **Preview Branching** so each Preview deployment gets its own Neon branch (isolated data). Configure in the same connect flow under advanced options.
5. After connect, Vercel injects **`DATABASE_URL`** (pooled) and related `PG*` / `DATABASE_URL_UNPOOLED` variables per Neon’s [environment variable table](https://neon.com/docs/guides/vercel-managed-integration#environment-variables-set-by-the-integration). **MSS reads `DATABASE_URL` as a fallback** if `PRODUCTION_POSTGRES_URL` / `PREVIEW_POSTGRES_URL` are unset, so you often do **not** need duplicate variables—just ensure **Production** and **Preview** each receive a connection string (Vercel scopes integration vars by environment when you connect).
6. **Open in Neon:** from Vercel Storage, use **Open in Neon** if you want the Neon Console (project may live under a `Vercel:` organization).

**Alternative:** If you prefer a **standalone** Neon project created only in the Neon console, use a different email/org or Neon’s [Neon-Managed + Vercel](https://neon.com/docs/guides/neon-managed-vercel-integration) flow—do not mix both integration types in one Vercel project.

#### How to — rotate the database password and verify Vercel (step-by-step)

Use this if a connection string was **posted somewhere unsafe** (chat, ticket, screenshot) or you want a clean baseline.

**A. Open the right place in Neon**

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign in (same identity you use for Vercel/Neon is fine).
2. In the left column, pick the **Organization** that holds your MSS database (if you used Vercel-managed Neon, it may be named like **`Vercel: …`**).
3. Click your **MSS** project (the name you gave when installing Neon for `mss`).

**B. Reset the role password (Neon UI names can vary slightly)**

4. Open **project Settings** (gear icon) or look for **Roles**, **Database access**, or **Connection details** on the project dashboard—Neon moves labels occasionally.
5. Find the **database owner role** used in your URL (often **`neondb_owner`** or similar). Use **Reset password** / **Rotate password** / **Regenerate** if Neon offers it.
6. Neon will show the **new password only once**. Copy it into a **password manager** or a private note on your machine. **Do not paste it into chat, GitHub, or the Google Config Sheet.**

**C. Refresh connection strings in Neon (to copy the new URL for yourself only)**

7. Still in Neon: open **Dashboard** (or **Branches** → select your **production** branch, usually `main`).
8. Open **Connection details** / **Connect** and choose the **pooled** / **transaction** connection (hostname usually contains **`pooler`**).
9. Copy the full **`DATABASE_URL`** line for your own use. **Do not send it to anyone.** You mainly need to know that **Vercel** must end up holding this value, not your repo.

**D. Make sure Vercel has the new secret**

10. Open [https://vercel.com](https://vercel.com) → your **`mss`** project (not only the Integrations page).
11. Go **Settings** → **Environment Variables**.
12. Search for **`DATABASE_URL`** (and optionally **`POSTGRES_URL`**).  
    - **If you use the Vercel ↔ Neon integration:** variables are often **managed**—after a password rotation, **trigger a new production deploy** (Deployments → … → **Redeploy**) and check whether the build/runtime still connects. If deploys fail with “password authentication failed,” open **Storage** (or **Integrations → Neon → Manage**) and look for **refresh / reconnect / sync** for that database, or temporarily **set `DATABASE_URL` manually** for **Production** (and **Preview**) using the **new** pooled string from Neon step 8–9, then redeploy.  
    - **If variables are manual:** edit **`DATABASE_URL`** for **Production** (paste new pooled URL), repeat for **Preview** if you use a different branch/URL there, **Save**.
13. From **Deployments**, open the latest deployment → **Redeploy** (or push an empty commit) so running code picks up credentials.

**E. Validate (no secrets required)**

| Check | Where | What “good” looks like |
|--------|--------|-------------------------|
| Variables exist | Vercel → **mss** → **Settings** → **Environment Variables** | **`DATABASE_URL`** listed for **Production** (and **Preview** if you use previews). Values show as **masked** (`••••`). |
| Deploy succeeds | Vercel → **Deployments** | Latest deploy **Ready** / green, not **Error** on the build step. |
| Database answers | Neon → **SQL Editor** (left nav) | Run `SELECT 1 as ok;` → one row **`1`**. |
| App still may show Config error | Browser → `https://mss-umber.vercel.app` | **Normal** until **Config Sheet** env vars exist; DB is separate. After Sheet + `NEXTAUTH_*` are set, you should see the real shell. |
| DB used by API (later) | After Sheet works, call **`/api/init-database`** (with bootstrap secret or admin) | Success JSON; then auth flows can use the DB. |

**F. Local machine (optional)**

14. On your PC, edit **`.env.local`** (never commit): set **`LOCAL_POSTGRES_URL`** or **`DATABASE_URL`** to the **pooled** URL for the branch you use for local dev (often the same as **Preview** / `preview` branch). Restart **`npm run dev`**.

### 2.2 Google Config Sheet

- [ ] Create Sheet with tabs **`PROD`** and **`STAGE`**.
- [ ] Add required keys from [BASE_APP_REQUIREMENTS §7](templates/BASE_APP_REQUIREMENTS.md) on both tabs.
- [ ] Enable **public CSV export**; record Sheet ID and GIDs in env (`SITE_CONFIG_*`).

#### How to — Google Config Sheet (beginner walkthrough)

**What this is:** A **Google Sheet** that holds **non-secret** text (site name, logo URL, welcome messages). MSS reads it as **CSV** over the public export URL. **Never** put passwords or API keys in the sheet.

1. **Create a spreadsheet**  
   Go to [https://sheets.google.com](https://sheets.google.com) → **Blank** spreadsheet. Title it e.g. `MSS Site Config`.

2. **Name the tabs exactly**  
   - Rename the first tab to **`PROD`** (all caps).  
   - Add a second tab named **`STAGE`** (all caps).  
   Spelling must match; the app picks the tab by **GID** in environment variables.

3. **Row layout (both tabs)**  
   - **Column A:** parameter name (canonical key, see table below).  
   - **Column B:** value.  
   - Optional **row 1** headers: `parameter` | `value` — if you use headers, start keys from **row 2**.

4. **Required keys (same rows on both `PROD` and `STAGE`)**  
   You may use different **values** per tab (e.g. different `site_subtitle` on staging), but every key must exist on **both** tabs.

   | Column A (key) | Column B (example — customize) |
   |----------------|----------------------------------|
   | `site_name` | `MSS` |
   | `site_subtitle` | `Staging` on STAGE tab, short tagline on PROD |
   | `site_logo` | `site/logo.svg` (path under **`public/`**; repo includes `public/site/logo.svg`) |
   | `signin_welcome` | `Welcome. Sign in below.` (optional: `{Full Name}`, `{Display Name}`, `{Initials}` — guest fallbacks when not signed in) |
   | `signup_welcome` | `Create an account to get started.` (same placeholders) |
   | `profile_hover` | `Open your profile` or e.g. `{Display Name}` — resolved from session when signed in |
   | `acct_confirm_success_header` | e.g. `You're all set` |
   | `acct_confirm_success_message1` | e.g. `Your account is confirmed.` |
   | `acct_confirm_success_button1` | e.g. `Go to Home|/` (label, pipe, then path) |
   | `acct_confirm_success_button2` | `X` to hide, or e.g. `Profile|/profile` |
   | `footer_text` | e.g. `© 2026 My App \| All rights reserved` |
   | `email_contact_address` | Support or app inbox (valid email) |
   | `welcome_greeting_logged_in` | e.g. `Welcome back, {Display Name}!` — use `{Full Name}`, `{Display Name}`, `{Initials}`; legacy `{name}` = display name |
   | `welcome_greeting_logged_out` | e.g. `Welcome! Please sign in.` — same tokens resolve to guest fallbacks when logged out |

5. **Make the sheet readable without logging in**  
   Click **Share** (top right). Under **General access**, set **Anyone with the link** to **Viewer** (wording may vary slightly). This allows MSS on Vercel to fetch the CSV without a Google login. Do **not** use the Config Sheet for secrets.

6. **Spreadsheet ID**  
   From the browser URL when the spreadsheet is open:

   `https://docs.google.com/spreadsheets/d/`**`SPREADSHEET_ID_HERE`**`/edit...`  
   Copy only the long ID between `/d/` and `/edit`.

7. **GID for each tab**  
   - Click the **`PROD`** tab so it is active. Look at the URL; it should contain `gid=`**`NUMBER`**. Copy that number → **`SITE_CONFIG_GID_PROD`**.  
   - Click the **`STAGE`** tab; copy its `gid=` value → **`SITE_CONFIG_GID_STAGE`**.

8. **Quick test in a browser**  
   Build this URL (replace `SHEET_ID` and `GID`):

   `https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID`  

   Open it in an **incognito/private** window (not logged into Google). You should see CSV text. If you get a sign-in wall or error, sharing is not public enough yet.

9. **Vercel environment variables for the sheet**

   | Variable | Typical scope | Value |
   |----------|----------------|--------|
   | `SITE_CONFIG_SHEET_ID` | **Production**, **Preview**, **Development** | Same spreadsheet ID everywhere |
   | `SITE_CONFIG_GID_PROD` | **Production** only | GID of tab `PROD` |
   | `SITE_CONFIG_GID_STAGE` | **Preview** and **Development** (and optionally Production if you ever read STAGE there — normally prod uses PROD GID only) | GID of tab `STAGE` |

   MSS logic: **Production** deployments use the **PROD** tab; **Preview** and **local** use the **STAGE** tab.

When done, fill **Config Sheet ID**, **`PROD` GID**, and **`STAGE` GID** in the summary table at the top of this file (IDs only — not secret, but keep the doc private if you prefer).

#### After Neon + Sheet — minimum Vercel env (reminder)

You still need **`NEXTAUTH_URL`**, **`NEXTAUTH_SECRET`**, and (for email flows) **`EMAIL_SERVER_*`** / **`EMAIL_FROM`** before auth behaves fully. Production **`NEXTAUTH_URL`**: `https://mss-umber.vercel.app` (see §1.2). For **Preview**, set **`NEXTAUTH_URL`** to that deployment’s public URL pattern (each preview URL differs; see [Vercel environment variables](https://vercel.com/docs/projects/environment-variables) — some teams use a fixed staging domain for previews).

### 2.3 Google Cloud

- [ ] _(Deferred)_ Private Sheets + service account if you outgrow public CSV export.

### 2.4 Email (transactional)

Generic branching doc: [PROJECT_START_CHECKLIST.md §2.4 — Path A vs Path B](templates/PROJECT_START_CHECKLIST.md#24-email-transactional).

**MSS chose Path B (no custom domain): Gmail SMTP**

- [x] Dedicated Gmail inbox: **`mystudioscheduler@gmail.com`** (sending identity for registration + password reset).
- [x] Google Account **2-Step Verification** enabled for that mailbox ([Security](https://myaccount.google.com/security)).
- [x] **App password** created ([App passwords](https://myaccount.google.com/apppasswords); [help](https://support.google.com/accounts/answer/185833)) — used as **`EMAIL_SERVER_PASSWORD`** in Vercel and `.env.local` (never the normal Gmail password).
- [x] Vercel env: `EMAIL_SERVER_HOST=smtp.gmail.com`, `EMAIL_SERVER_PORT=587`, `EMAIL_SERVER_SECURE=false`, `EMAIL_SERVER_USER` / `EMAIL_FROM` = `mystudioscheduler@gmail.com` (or `Display Name <mystudioscheduler@gmail.com>`), `EMAIL_SERVER_PASSWORD` = app password — scoped to **Preview** and **Production**; redeploy triggered.
- [x] Local: same keys in **`.env.local`** for `npm run dev` mail tests (optional).
- [ ] **Smoke test after deploy:** Preview → register → confirm email; forgot-password → reset email. Repeat on Production when ready.

---

## Part 3 — Environment variables

Use [.env.example](../../.env.example) as the local template. Mirror the same keys in **Vercel → Environment Variables** (Preview first, then Production).

**MSS-specific additions** (also listed in `.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_BOOTSTRAP_SECRET` | Optional. If set, `POST /api/init-database` with header `x-database-bootstrap-secret` can run before any admin exists. |
| `NEXT_PUBLIC_DEV_AUTH_BYPASS` | Optional. Should mirror `DEV_AUTH_BYPASS` so the sign-in UI can explain local dev mode. |

---

## Part 4 — Order of operations (run when infra exists)

1. [x] Repo on GitHub; push this codebase.
2. [ ] Neon URLs; Vercel project linked.
3. [ ] Vercel **Preview** env vars (see template checklist Part 3).
4. [ ] Config Sheet + GIDs.
5. [ ] Deploy preview; call **`/api/init-database`** (admin session or bootstrap secret).
6. [ ] Smoke test preview: config, **Staging** banner, register → confirm → sign-in, admin users, profile/avatar (if `BLOB_READ_WRITE_TOKEN` set).
7. [ ] Production env vars; deploy production; init DB; smoke test (no banner).

---

## Part 5 — Ongoing per release

- [x] `npm run build` passes in repo (run locally or in CI before releases).
- [ ] After Config Sheet change: verify behavior if CDN/browser caches CSV (short `revalidate` is used on fetch).
- [ ] After schema change: run init/migration path on staging before prod.

---

## Part 6 — Handoff

- Authoritative spec: [docs/templates/BASE_APP_REQUIREMENTS.md](templates/BASE_APP_REQUIREMENTS.md)
- Engineering depth: [docs/templates/GLOBAL_ENGINEERING_STANDARDS.md](templates/GLOBAL_ENGINEERING_STANDARDS.md)
- Friction log: [docs/startup/ITERATION_LOG.md](startup/ITERATION_LOG.md)

---

*Redact all secrets before sharing this file externally.*
