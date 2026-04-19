import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rateLimit";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { validateRegistration } from "@/lib/validation/validators";
import { hashPassword } from "@/lib/services/authService";
import { generateSecureToken } from "@/lib/services/tokenService";
import { createUser, getUserByEmail } from "@/lib/repositories/userRepository";
import { TokenExpiration } from "@/lib/constants";
import {
  sendConfirmationEmail,
  sendDuplicateRegistrationEmail,
} from "@/lib/emailService";
import { loadSiteConfig, isSiteConfigError } from "@/lib/siteConfig";
import { successResponse, ApiErrors } from "@/lib/api/responses";
import {
  defaultDisplayName,
  defaultInitialsFromDisplay,
} from "@/lib/profileDefaults";

export async function POST(request: Request) {
  try {
    const limited = rateLimitMiddleware(
      request,
      "auth:register",
      RATE_LIMITS.AUTH_REGISTER,
    );
    if (limited) return limited;

    const body = await request.json();
    const v = validateRegistration({
      email: body.email,
      name: body.name,
      password: body.password,
      confirmPassword: body.confirmPassword,
    });
    if (!v.valid) return ApiErrors.validationError(v.error!);

    const cfg = await loadSiteConfig();
    if (isSiteConfigError(cfg)) {
      return ApiErrors.serverError();
    }

    const env = getCurrentEnvironment();
    const existing = await getUserByEmail(body.email, env);
    if (existing) {
      try {
        await sendDuplicateRegistrationEmail(body.email.trim(), cfg);
      } catch (mailErr) {
        console.error("[register] duplicate email send failed", mailErr);
        return ApiErrors.serverError();
      }
      return successResponse({ sent: true, duplicate: true }, cfg.sign_up_confirm);
    }

    const passwordHash = await hashPassword(body.password);
    const token = generateSecureToken();
    const expires = new Date(Date.now() + TokenExpiration.CONFIRMATION_MS);

    await createUser({
      email: body.email,
      name: body.name.trim(),
      passwordHash,
      environment: env,
      confirmationToken: token,
      confirmationExpires: expires,
    });

    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const confirmUrl = `${base.replace(/\/$/, "")}/api/auth/confirm?token=${encodeURIComponent(token)}`;

    const nameTrimmed = body.name.trim();
    const displayName = defaultDisplayName(nameTrimmed);
    const initials = defaultInitialsFromDisplay(displayName).slice(0, 3);

    try {
      await sendConfirmationEmail(
        body.email.trim(),
        cfg,
        {
          fullName: nameTrimmed,
          displayName,
          initials,
          email: body.email.trim().toLowerCase(),
        },
        confirmUrl,
      );
    } catch (mailErr) {
      console.error("[register] email failed", mailErr);
      return ApiErrors.serverError();
    }

    return successResponse({ sent: true }, cfg.sign_up_confirm);
  } catch (e) {
    console.error("[register]", e);
    return ApiErrors.serverError();
  }
}
