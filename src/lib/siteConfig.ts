import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";

const REQUIRED_KEYS = [
  "site_name",
  "site_subtitle",
  "site_logo_url",
  "signin_welcome",
  "signup_welcome",
  "profile_hover",
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

function validateUrl(value: string, key: SiteConfigKey): SiteConfigFailure | null {
  if (key !== "site_logo_url") return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return {
        kind: "config_error",
        reason: "invalid_type",
        key,
        detail: "expected http(s) URL",
      };
    }
  } catch {
    return {
      kind: "config_error",
      reason: "invalid_type",
      key,
      detail: "expected valid URL",
    };
  }
  return null;
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
    const urlErr = validateUrl(val, key);
    if (urlErr) return urlErr;
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
