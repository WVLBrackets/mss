import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rateLimit";
import { validateEmail } from "@/lib/validation/validators";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { getUserByEmail, setResetToken } from "@/lib/repositories/userRepository";
import { generateSecureToken } from "@/lib/services/tokenService";
import { TokenExpiration } from "@/lib/constants";
import { sendPasswordResetEmail } from "@/lib/emailService";
import { successResponse, ApiErrors } from "@/lib/api/responses";

export async function POST(request: Request) {
  try {
    const limited = rateLimitMiddleware(
      request,
      "auth:forgot",
      RATE_LIMITS.AUTH_FORGOT_PASSWORD,
    );
    if (limited) return limited;

    const body = await request.json();
    const ev = validateEmail(body.email);
    if (!ev.valid) return ApiErrors.validationError(ev.error!);

    const env = getCurrentEnvironment();
    const user = await getUserByEmail(body.email, env);
    if (user) {
      const token = generateSecureToken();
      const expires = new Date(Date.now() + TokenExpiration.RESET_MS);
      await setResetToken(body.email, env, token, expires);
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${base.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(token)}`;
      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch (e) {
        console.error("[forgot-password] email", e);
        return ApiErrors.serverError();
      }
    }
    return successResponse(
      { ok: true },
      "If an account exists, password reset instructions were sent.",
    );
  } catch (e) {
    console.error("[forgot-password]", e);
    return ApiErrors.serverError();
  }
}
