import { NextResponse } from "next/server";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  getUserByConfirmationToken,
  updateUserConfirmation,
  setHandoffToken,
} from "@/lib/repositories/userRepository";
import { generateSecureToken } from "@/lib/services/tokenService";

const HANDOFF_TTL_MS = 15 * 60 * 1000;

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
  const handoff = generateSecureToken();
  await setHandoffToken(
    user.id,
    env,
    handoff,
    new Date(Date.now() + HANDOFF_TTL_MS),
  );
  return NextResponse.redirect(
    `${base}/auth/account-confirmed?h=${encodeURIComponent(handoff)}`,
  );
}
