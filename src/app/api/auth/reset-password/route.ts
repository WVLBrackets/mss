import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rateLimit";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  getUserByResetToken,
  clearResetToken,
  updatePassword,
} from "@/lib/repositories/userRepository";
import { validatePassword } from "@/lib/validation/validators";
import { hashPassword } from "@/lib/services/authService";
import { successResponse, ApiErrors } from "@/lib/api/responses";

export async function POST(request: Request) {
  try {
    const limited = rateLimitMiddleware(
      request,
      "auth:reset",
      RATE_LIMITS.AUTH_RESET_PASSWORD,
    );
    if (limited) return limited;

    const body = await request.json();
    const { token, password, confirmPassword } = body;
    if (!token || typeof token !== "string") {
      return ApiErrors.validationError("Token is required");
    }
    const pv = validatePassword(password);
    if (!pv.valid) return ApiErrors.validationError(pv.error!);
    if (password !== confirmPassword) {
      return ApiErrors.validationError("Passwords do not match");
    }

    const env = getCurrentEnvironment();
    const user = await getUserByResetToken(token, env);
    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      return ApiErrors.validationError("Invalid or expired reset link");
    }

    const hash = await hashPassword(password);
    await updatePassword(user.id, env, hash);
    await clearResetToken(user.id, env);
    return successResponse({ ok: true }, "Password updated. You can sign in.");
  } catch (e) {
    console.error("[reset-password]", e);
    return ApiErrors.serverError();
  }
}
