import { Environment, type EnvironmentValue } from "@/lib/constants";

/**
 * Resolves the logical deployment environment for DB isolation and banners.
 * Aligns with BASE_APP_REQUIREMENTS §8 and PROJECT_START_CHECKLIST env matrix.
 */
export function getCurrentEnvironment(): EnvironmentValue {
  const vercelEnv = process.env.VERCEL_ENV;
  const appEnv = process.env.APP_ENV?.toLowerCase();
  const nodeEnv = process.env.NODE_ENV;

  if (appEnv === "local" || (nodeEnv === "development" && !process.env.VERCEL)) {
    return Environment.DEVELOPMENT;
  }
  if (vercelEnv === "production" || appEnv === "production") {
    return Environment.PRODUCTION;
  }
  return Environment.PREVIEW;
}

/**
 * True when running on a developer workstation (not Vercel).
 */
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

/**
 * When true, `POST /api/auth/register` skips confirmation email and marks new users confirmed
 * immediately (see register route). **All** of the following must hold:
 *
 * - `AUTO_CONFIRM_LOCAL_REGISTRATION` is exactly `"true"`
 * - {@link isLocalDevelopment} — `next dev` on a machine without `VERCEL` set
 * - {@link getCurrentEnvironment} is {@link Environment.DEVELOPMENT}
 *
 * Vercel (Preview/Production) and `next start` with `NODE_ENV=production` never satisfy this.
 * Never enable while `DATABASE_URL` points at shared non-dev data.
 */
export function allowAutoConfirmLocalRegistration(): boolean {
  if (process.env.AUTO_CONFIRM_LOCAL_REGISTRATION !== "true") return false;
  if (!isLocalDevelopment()) return false;
  if (getCurrentEnvironment() !== Environment.DEVELOPMENT) return false;
  return true;
}

/**
 * True for Vercel preview deployments (non-production).
 */
export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === "preview";
}
