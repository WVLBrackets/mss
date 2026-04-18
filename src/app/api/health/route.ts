import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    },
  });
}
