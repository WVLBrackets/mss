import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";
import { parseConfigButton } from "@/lib/configButton";

/**
 * Auth-related copy with server defaults if omitted or empty in the Config Sheet.
 * Keeps `signin_welcome` / `signup_welcome` loading even when these rows are not added yet.
 */
const AUTH_MESSAGE_DEFAULTS = {
  password_reset_message:
    "If an account exists, password reset instructions were sent.",
  sign_up_confirm: "Check your email to confirm your account.",
  dup_email_subject: "Account request",
  dup_email_header: "We received a request",
  dup_email_greeting: "Hello,",
  dup_email_message1:
    "Someone tried to create an account using this email address. If this was you, you may already have an account—try signing in or use Forgot password.",
  dup_email_message2: "If you did not request this, you can ignore this message.",
  dup_email_footer: "Do not reply to this message.",
} as const;

type AuthMessageKey = keyof typeof AUTH_MESSAGE_DEFAULTS;

const CORE_REQUIRED_KEYS = [
  "site_name",
  "site_subtitle",
  "site_logo",
  "signin_welcome",
  "signup_welcome",
  "profile_hover",
  "acct_confirm_success_header",
  "acct_confirm_success_message1",
  "acct_confirm_success_button1",
  "acct_confirm_success_button2",
  "footer_text",
  "email_contact_address",
  "welcome_greeting_logged_in",
  "welcome_greeting_logged_out",
] as const;

export type SiteConfigKey =
  | (typeof CORE_REQUIRED_KEYS)[number]
  | AuthMessageKey;

export type SiteConfig = Record<SiteConfigKey, string>;

export type SiteConfigErrorReason =
  | "fetch_failed"
  | "missing"
  | "empty"
  | "invalid_type";

export interface SiteConfigFailure {
  kind: "config_error";
  reason: SiteConfigErrorReason;
  key?: SiteConfigKey;
  detail?: string;
}

export function isSiteConfigError(
  r: SiteConfig | SiteConfigFailure,
): r is SiteConfigFailure {
  return "kind" in r && r.kind === "config_error";
}

function getSheetCsvUrl(): string | null {
  const sheetId = process.env.SITE_CONFIG_SHEET_ID;
  const isProd = getCurrentEnvironment() === Environment.PRODUCTION;
  const gid = isProd
    ? process.env.SITE_CONFIG_GID_PROD
    : process.env.SITE_CONFIG_GID_STAGE;
  if (!sheetId || !gid) {
    return null;
  }
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Splits one CSV line into fields, respecting double-quoted segments so commas
 * inside values are not treated as delimiters (Google Sheets export format).
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function parseCsvRows(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = text.split(/\r?\n/);
  let consecutiveBlank = 0;
  for (const line of lines) {
    if (!line.trim()) {
      consecutiveBlank += 1;
      if (consecutiveBlank >= 2) break;
      continue;
    }
    consecutiveBlank = 0;
    const cells = splitCsvLine(line);
    if (cells.length < 2) continue;
    const k0 = cells[0]!.replace(/^"|"$/g, "").trim();
    const v0 = cells.slice(1).join(",").trim();
    const nk = normalizeKey(k0);
    if (nk === "parameter" || nk === "key" || nk === "name") continue;
    map.set(nk, v0);
  }
  return map;
}

/**
 * Normalizes `site_logo` from the sheet: trim, strip optional wrapping quotes,
 * strip a mistaken `public/` prefix (path is already relative to `public/`).
 */
function normalizeSiteLogoPath(raw: string): string {
  let v = raw.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1).replace(/""/g, '"').trim();
  }
  const lower = v.toLowerCase();
  if (lower.startsWith("public/")) {
    v = v.slice("public/".length).trim();
  }
  return v;
}

function validateSiteLogo(value: string, key: SiteConfigKey): SiteConfigFailure | null {
  if (key !== "site_logo") return null;
  const valueNorm = normalizeSiteLogoPath(value);
  if (!valueNorm) {
    return {
      kind: "config_error",
      reason: "empty",
      key,
      detail: "site_logo is empty",
    };
  }
  if (valueNorm.includes("..") || valueNorm.startsWith("/") || valueNorm.includes("\\")) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "site_logo must be a relative path under public/ (no .., backslashes, or leading slash)",
    };
  }
  if (/\/\/|:|\?|#/.test(valueNorm)) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "site_logo must be a relative file path, not a full URL",
    };
  }
  if (valueNorm.length > 200) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "site_logo path is too long (max 200 characters)",
    };
  }
  if (/[<>"\x00-\x1f]/.test(valueNorm)) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "site_logo contains disallowed characters (e.g. quotes, angle brackets, or control characters)",
    };
  }
  return null;
}

const EMAIL_CONTACT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Zero-width / BOM characters that often sneak in from copy-paste or CSV. */
const INVISIBLE_EMAIL_JUNK = /[\u200b-\u200d\ufeff]/g;

/**
 * Common wrapping quote pairs (ASCII + typographic). Sheets and paste often
 * produce “curly” quotes that are not stripped by CSV parsers as field delimiters.
 */
const EMAIL_WRAPPING_QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['"', '"'],
  ["'", "'"],
  ["\u201c", "\u201d"], // “ ”
  ["\u2018", "\u2019"], // ‘ ’
  ["\u00ab", "\u00bb"], // « »
  ["\u201e", "\u201d"], // „ ”
  ["\u201a", "\u2019"], // ‚ ’
];

/**
 * Removes paired wrapping quotes from both ends until stable (handles nested CSV-style quotes).
 */
function stripEmailWrappingQuotes(v: string): string {
  let s = v.trim();
  for (;;) {
    let changed = false;
    for (const [open, close] of EMAIL_WRAPPING_QUOTE_PAIRS) {
      if (s.length >= 2 && s.startsWith(open) && s.endsWith(close)) {
        let inner = s.slice(open.length, s.length - close.length);
        if (open === '"' && close === '"') {
          inner = inner.replace(/""/g, '"');
        }
        s = inner.trim();
        changed = true;
      }
    }
    if (!changed) break;
  }
  return s;
}

/**
 * Normalizes footer contact email from the sheet: trim, strip BOM and
 * zero-width characters, optional wrapping quotes (ASCII and typographic),
 * optional `mailto:` prefix, and extract `addr@domain` from `Display Name <addr@domain>`.
 */
function normalizeEmailContactAddress(raw: string): string {
  let v = raw.trim().replace(/^\ufeff/, "").replace(INVISIBLE_EMAIL_JUNK, "");
  v = stripEmailWrappingQuotes(v);
  const mailto = v.toLowerCase();
  if (mailto.startsWith("mailto:")) {
    v = v.slice("mailto:".length).trim();
    v = stripEmailWrappingQuotes(v);
  }
  const angle = v.match(/<(\s*[^\s<]+@[^\s>]+\.[^\s>]+\s*)>/);
  if (angle?.[1]) {
    return angle[1].trim().replace(/,\s*$/, "");
  }
  return v.trim().replace(/,\s*$/, "");
}

function validateEmailContact(value: string, key: SiteConfigKey): SiteConfigFailure | null {
  if (key !== "email_contact_address") return null;
  const norm = normalizeEmailContactAddress(value);
  if (!EMAIL_CONTACT_RE.test(norm)) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail:
        "email_contact_address must be a valid email (plain address or \"Name <addr@domain.com>\"). Check for typographic (“curly”) quotes, stray ASCII quotes, spaces, or CSV truncation.",
    };
  }
  return null;
}

function validateNavButton(
  value: string,
  key: SiteConfigKey,
  allowX: boolean,
): SiteConfigFailure | null {
  if (
    key !== "acct_confirm_success_button1" &&
    key !== "acct_confirm_success_button2"
  ) {
    return null;
  }
  const t = value.trim();
  if (key === "acct_confirm_success_button1" && t.toUpperCase() === "X") {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "acct_confirm_success_button1 cannot be X",
    };
  }
  if (allowX && t.toUpperCase() === "X") return null;
  const parsed = parseConfigButton(value);
  if (parsed === "hidden") {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "expected Label|/path or http(s) URL path",
    };
  }
  const { path } = parsed;
  if (!path.startsWith("/") && !path.startsWith("http://") && !path.startsWith("https://")) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "button path must start with / or http(s)://",
    };
  }
  return null;
}

function validateValue(key: SiteConfigKey, val: string): SiteConfigFailure | null {
  return (
    validateSiteLogo(val, key) ??
    validateEmailContact(val, key) ??
    validateNavButton(val, key, key === "acct_confirm_success_button2")
  );
}

function buildConfig(map: Map<string, string>): SiteConfig | SiteConfigFailure {
  const out = {} as Partial<SiteConfig>;
  for (const key of CORE_REQUIRED_KEYS) {
    if (!map.has(key)) {
      return { kind: "config_error", reason: "missing", key };
    }
    const val = map.get(key)!;
    if (!val.trim()) {
      return { kind: "config_error", reason: "empty", key };
    }
    const err = validateValue(key, val);
    if (err) return err;
    out[key] =
      key === "site_logo"
        ? normalizeSiteLogoPath(val)
        : key === "email_contact_address"
          ? normalizeEmailContactAddress(val)
          : val;
  }
  for (const key of Object.keys(AUTH_MESSAGE_DEFAULTS) as AuthMessageKey[]) {
    const raw = map.get(key)?.trim();
    out[key] =
      raw && raw.length > 0 ? raw : AUTH_MESSAGE_DEFAULTS[key];
  }
  return out as SiteConfig;
}

async function fetchConfigUncached(): Promise<SiteConfig | SiteConfigFailure> {
  const url = getSheetCsvUrl();
  if (!url) {
    return {
      kind: "config_error",
      reason: "fetch_failed",
      detail:
        "SITE_CONFIG_SHEET_ID and SITE_CONFIG_GID_PROD / SITE_CONFIG_GID_STAGE must be set",
    };
  }

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 60 } });
  } catch (e) {
    return {
      kind: "config_error",
      reason: "fetch_failed",
      detail: e instanceof Error ? e.message : "network error",
    };
  }

  if (!res.ok) {
    return {
      kind: "config_error",
      reason: "fetch_failed",
      detail: `HTTP ${res.status}`,
    };
  }

  const text = await res.text();
  const map = parseCsvRows(text);
  return buildConfig(map);
}

/**
 * Loads strict site configuration from the Config Sheet CSV export.
 * Uses `next.revalidate` on fetch for short TTL caching.
 */
export async function loadSiteConfig(): Promise<SiteConfig | SiteConfigFailure> {
  return fetchConfigUncached();
}

/**
 * Public URL path for a file under `/public` (leading slash, no duplicate slashes).
 */
export function publicAssetUrl(siteLogoPath: string): string {
  const p = siteLogoPath.replace(/^\/+/, "");
  return `/${p}`;
}

