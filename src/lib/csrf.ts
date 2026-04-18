import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "csrf_token";
const HEADER_NAME = "x-csrf-token";

export const CSRF_EXEMPT_PATHS = new Set<string>([
  "/api/auth",
  "/api/csrf-token",
  "/api/init-database",
]);

/**
 * Double-submit cookie CSRF: opaque token must match between cookie and header.
 */
export function createCsrfTokenValue(): string {
  return randomBytes(32).toString("hex");
}

export function validateCsrfToken(
  cookieVal: string | undefined,
  headerVal: string | null,
): boolean {
  if (!cookieVal || !headerVal) return false;
  return cookieVal === headerVal && cookieVal.length >= 16;
}

/**
 * Validates CSRF for mutating API routes. Exempt paths skip validation.
 */
export function csrfProtection(request: Request): NextResponse | null {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;
  for (const p of CSRF_EXEMPT_PATHS) {
    if (pathname === p || pathname.startsWith(p + "/")) return null;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const cookie = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  const header = request.headers.get(HEADER_NAME);
  if (!validateCsrfToken(cookie, header)) {
    return NextResponse.json(
      { success: false, error: "Invalid CSRF token", code: "CSRF_INVALID" },
      { status: 403 },
    );
  }
  return null;
}

export function setCsrfCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export { COOKIE_NAME as CSRF_COOKIE_NAME, HEADER_NAME as CSRF_HEADER_NAME };
