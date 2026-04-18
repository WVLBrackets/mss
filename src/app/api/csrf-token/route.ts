import { NextResponse } from "next/server";
import { createCsrfTokenValue, setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  const token = createCsrfTokenValue();
  const res = NextResponse.json({ success: true, data: { token } });
  setCsrfCookie(res, token);
  return res;
}
