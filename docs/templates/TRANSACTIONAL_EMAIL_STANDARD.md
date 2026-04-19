# Transactional email standard (six-part layout)

**Audience:** Engineers adding or changing lifecycle / auth / sheet-driven emails in portfolio apps that follow the **Base App** pattern (e.g. MSS).  
**Normative summary:** **[GLOBAL_ENGINEERING_STANDARDS.md §9](GLOBAL_ENGINEERING_STANDARDS.md#9-email--notifications)** — this file is the **detailed reference** and checklist.

---

## Why this exists

- **One visual and structural pattern** for registration, password reset, duplicate-account notices, and future transactional mail: left-aligned body, predictable hierarchy, safe HTML escaping.
- **Config Sheet–driven copy** where the product uses a strict config sheet: operators edit subjects and bodies without code deploys.
- **Non-production inboxes** stay obvious: subject prefixes distinguish **Preview/staging** vs **local** vs **production**.

---

## Reminder for future work

> **When you add a new transactional email** (welcome, invite, billing receipt, etc.), **use this six-part pattern by default**: shared layout helper, sheet keys (or defaults), piped link row only when the message includes a single primary URL.  
> If the design truly needs attachments, heavy custom layout, or a third-party template builder, get **Application Architect** sign-off and document the exception in the project README or an ADR.

---

## Non-production subject prefixes

Implemented in code as **`emailSubjectEnvironmentPrefix()`** (`src/lib/emailSubjectPrefix.ts`), applied in **`src/lib/emailService.ts`** to every outbound subject from that module.

| Environment | Prefix (before the real subject) | Meaning |
|---------------|-----------------------------------|---------|
| **Production** | *(none)* | Live customers see only the configured subject. |
| **Vercel Preview** (`VERCEL_ENV === preview`) | `🟡 Staging 🟡 ` | Yellow circle, word *Staging*, second yellow circle, space, then subject. |
| **Local development** (e.g. `next dev`, not Vercel production) | `🟠 Local 🟠 ` | Orange circle, word *Local*, second orange circle, space, then subject. |

Resolution uses **`getCurrentEnvironment()`** (`src/lib/appEnvironment.ts`) so preview vs local vs production stays consistent with DB and config sheet tab selection.

---

## Six-part layout (HTML)

All of the following share **`buildSixPartEmailHtml()`** in **`src/lib/sixPartTransactionalEmail.ts`**:

1. **Subject** — from config; prefix added as above when not production.
2. **Header** — single **`<h1>`** (sheet: `*_email_header`), then **two line breaks**.
3. **Greeting** — one block; supports **`resolveUserPlaceholders()`** (`src/lib/configPlaceholders.ts`) for `{Display Name}`, `{Full Name}`, `{email}`, `{Initials}`, `{name}`.
4. **Message 1** — first body paragraph after a line break.
5. **Message 2** — see below (plain paragraph **or** piped link).
6. **Footer** — smaller type (**80%** of body), left-aligned with the rest of the body.

Wrapper styles: **max-width ~560px**, **left-aligned** text (not centered in the pane), system-ui font stack, **escaped** interpolated strings via **`escapeHtml()`** (`src/lib/emailTemplate.ts`).

---

## Config key naming (`*_email_*`)

Use a **consistent prefix per email type**, six keys each:

| Suffix | Role |
|--------|------|
| `*_email_subject` | Subject line (after env prefix). |
| `*_email_header` | Top heading (`<h1>`). |
| `*_email_greeting` | Greeting line(s); placeholders resolved. |
| `*_email_message1` | First body paragraph. |
| `*_email_message2` | Second body block — see next subsection. |
| `*_email_footer` | Footer (80% font). |

**Examples in MSS today:** `reg_email_*`, `pwreset_email_*`, `dup_email_*` (see `src/lib/siteConfig.ts` defaults and optional sheet rows).

---

## `*_email_message2`: two patterns

### A) Emails with one primary action link (confirm, reset password)

Format:

```text
Link label|{Tokenized … link}
```

- Text **before** the first **`|`** becomes the **hyperlink label**.
- After the pipe, the sheet contains a **placeholder token** (spacing inside braces is flexible; matching is case-insensitive). Code substitutes the real URL when sending.
- **Registration:** placeholder **`{Tokenized confirmation link}`** — implemented as `TOKENIZED_CONFIRMATION_LINK` in `sixPartTransactionalEmail.ts`.
- **Password reset:** placeholder **`{Tokenized password reset link}`** — `TOKENIZED_PW_RESET_LINK`.

Builder: **`buildPipedLinkMessage2Html()`** (same module). If the row is malformed (no pipe or placeholder missing), the implementation falls back to safe escaped HTML and still includes a default link where appropriate.

### B) Emails with no tokenized link (e.g. duplicate registration)

`dup_email_message2` is **plain copy** only: rendered as a **single left-aligned paragraph** after placeholder resolution. Same outer six-part shell as A.

For duplicate mail, only the address may be known: use **`placeholdersFromEmailAddress()`** for `{email}` / name-like tokens.

---

## Code map (MSS / Base App)

| Concern | Location |
|---------|----------|
| Send mail (nodemailer), subject prefix usage | `src/lib/emailService.ts` |
| Shared layout + piped message2 | `src/lib/sixPartTransactionalEmail.ts` |
| Subject prefix rules | `src/lib/emailSubjectPrefix.ts` |
| HTML escape | `src/lib/emailTemplate.ts` |
| Placeholder resolution | `src/lib/configPlaceholders.ts` |
| Default strings + sheet merge | `src/lib/siteConfig.ts` |

---

## Operational notes

- **SMTP / `EMAIL_FROM`:** Still required at runtime; see project env docs and **`GLOBAL_ENGINEERING_STANDARDS.md`** §9 / deployment checklists.
- **Runtime env reads** in the mail layer: use bracket notation where documented for Vercel Sensitive vars during build (see comments in `emailService.ts`).
- **Tests:** When asserting on subjects in staging/local, allow for the **prefix** or set environment to production in the test harness if appropriate.

---

*Keep this file aligned with the code. When the pattern changes, update **GLOBAL_ENGINEERING_STANDARDS.md §9** and this document together.*
