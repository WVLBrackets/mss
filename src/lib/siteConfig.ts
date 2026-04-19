import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";
import { parseConfigButton } from "@/lib/configButton";

const REQUIRED_KEYS = [
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
  "welcome_greeting",
] as const;

export type SiteConfigKey = (typeof REQUIRED_KEYS)[number];

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
    const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    if (cells.length < 2) continue;
    const [k0, v0] = cells;
    const nk = normalizeKey(k0);
    if (nk === "parameter" || nk === "key" || nk === "name") continue;
    map.set(nk, v0 ?? "");
  }
  return map;
}

const SITE_LOGO_RE = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;

function validateSiteLogo(value: string, key: SiteConfigKey): SiteConfigFailure | null {
  if (key !== "site_logo") return null;
  if (value.includes("..") || value.startsWith("/") || value.includes("\\")) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "site_logo must be a path under public/ (no .. or leading slash)",
    };
  }
  if (value.length > 200 || !SITE_LOGO_RE.test(value)) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "site_logo must match [a-zA-Z0-9][a-zA-Z0-9/_.-]*",
    };
  }
  return null;
}

const EMAIL_CONTACT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailContact(value: string, key: SiteConfigKey): SiteConfigFailure | null {
  if (key !== "email_contact_address") return null;
  if (!EMAIL_CONTACT_RE.test(value.trim())) {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "email_contact_address must be a valid email",
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
  for (const key of REQUIRED_KEYS) {
    if (!map.has(key)) {
      return { kind: "config_error", reason: "missing", key };
    }
    const val = map.get(key)!;
    if (!val.trim()) {
      return { kind: "config_error", reason: "empty", key };
    }
    const err = validateValue(key, val);
    if (err) return err;
    out[key] = val;
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

