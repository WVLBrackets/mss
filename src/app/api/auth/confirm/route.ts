import { NextResponse } from "next/server";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  getUserByConfirmationToken,
  updateUserConfirmation,
} from "@/lib/repositories/userRepository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const base = (process.env.NEXTAUTH_URL ?? new URL(request.url).origin).replace(/\/$/, "");

  if (!token) {
    return NextResponse.redirect(`${base}/auth/signin?error=missing_token`);
  }
  const env = getCurrentEnvironment();
  const user = await getUserByConfirmationToken(token, env);
  if (!user) {
    return NextResponse.redirect(`${base}/auth/signin?error=invalid_token`);
  }
  if (user.confirmation_token_expires && user.confirmation_token_expires < new Date()) {
    return NextResponse.redirect(`${base}/auth/signin?error=expired_token`);
  }
  await updateUserConfirmation(user.id, env);
  return NextResponse.redirect(`${base}/auth/signin?confirmed=1`);
}
