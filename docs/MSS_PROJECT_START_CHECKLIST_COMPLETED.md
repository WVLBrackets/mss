# MSS — project start checklist (status copy)

This is a **working copy** of [docs/templates/PROJECT_START_CHECKLIST.md](templates/PROJECT_START_CHECKLIST.md) for the MSS rollout. Check boxes as you finish each step; secrets and connection strings stay in Vercel and `.env.local` only.

| Field | Value (fill in) |
|--------|-------------------|
| GitHub repository | https://github.com/WVLBrackets/mss |
| Vercel project name | `mss` (dashboard); production host `mss-umber.vercel.app` |
| Production URL | https://mss-umber.vercel.app |
| Preview URL pattern | Unique URL per deployment (see **Deployments** in Vercel; often `mss-git-<branch>-<org>.vercel.app` style for PRs) |
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

### 2.2 Google Config Sheet

- [ ] Create Sheet with tabs **`PROD`** and **`STAGE`**.
- [ ] Add required keys from [BASE_APP_REQUIREMENTS §7](templates/BASE_APP_REQUIREMENTS.md) on both tabs.
- [ ] Enable **public CSV export**; record Sheet ID and GIDs in env (`SITE_CONFIG_*`).

### 2.3 Google Cloud

- [ ] _(Deferred)_ Private Sheets + service account if you outgrow public CSV export.

### 2.4 Email (transactional)

- [ ] Configure SMTP (or provider); set `EMAIL_SERVER_*` and `EMAIL_FROM` in Vercel and locally.
- [ ] Send test: registration confirmation + password reset on **Preview** before Production.

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
