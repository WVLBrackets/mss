import { NextResponse } from "next/server";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";

type LimitKey = string;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<LimitKey, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;

export const RATE_LIMITS = {
  AUTH_LOGIN: { windowMs: WINDOW_MS, maxProd: 5, maxNonProd: 50 },
  AUTH_REGISTER: { windowMs: 60 * 60 * 1000, maxProd: 3, maxNonProd: 30 },
  AUTH_FORGOT_PASSWORD: { windowMs: 60 * 60 * 1000, maxProd: 3, maxNonProd: 30 },
  AUTH_RESET_PASSWORD: { windowMs: WINDOW_MS, maxProd: 5, maxNonProd: 50 },
  AUTH_CONFIRM: { windowMs: WINDOW_MS, maxProd: 10, maxNonProd: 100 },
} as const;

function isProductionLike(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    getCurrentEnvironment() === Environment.PRODUCTION
  );
}

function getClientId(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Returns a NextResponse when rate limited, otherwise null.
 */
export function rateLimitMiddleware(
  request: Request,
  routeKey: string,
  config: { windowMs: number; maxProd: number; maxNonProd: number },
): NextResponse | null {
  const id = `${routeKey}:${getClientId(request)}`;
  const max = isProductionLike() ? config.maxProd : config.maxNonProd;
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || now - bucket.windowStart > config.windowMs) {
    buckets.set(id, { count: 1, windowStart: now });
    return null;
  }

  if (bucket.count >= max) {
    const retryAfterSec = Math.ceil(
      (config.windowMs - (now - bucket.windowStart)) / 1000,
    );
    return NextResponse.json(
      {
        success: false,
        error: `Too many attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minutes.`,
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  bucket.count += 1;
  return null;
}
