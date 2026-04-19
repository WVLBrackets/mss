import { inspectSiteConfigSheet } from "@/lib/siteConfig";
import { NextResponse } from "next/server";

/**
 * Diagnostic dump of Config Sheet CSV parsing (keys, email column breakdown, build result).
 * Disabled on Vercel **production**. Requires `CONFIG_SHEET_DEBUG_SECRET` and matching
 * `Authorization: Bearer <secret>` or `?secret=` (header preferred — query may appear in logs).
 */
export async function GET(req: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Config sheet debug is disabled in production." },
      { status: 403 },
    );
  }

  const expected = process.env.CONFIG_SHEET_DEBUG_SECRET;
  if (!expected || expected.length < 8) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Set CONFIG_SHEET_DEBUG_SECRET (at least 8 characters) on this deployment to enable.",
      },
      { status: 404 },
    );
  }

  const auth = req.headers.get("authorization");
  const bearer =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  const q = new URL(req.url).searchParams.get("secret");
  const token = bearer || q;
  if (token !== expected) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const data = await inspectSiteConfigSheet();
  return NextResponse.json({ success: true as const, data });
}
