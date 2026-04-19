import { getAuthSession } from "@/lib/auth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { getUserById, updateProfile } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors } from "@/lib/api/responses";

const INITIALS_RE = /^[A-Za-z0-9]{1,3}$/;

export async function GET() {
  try {
    const session = await getAuthSession();
    const email = session?.user?.email;
    const userId = session?.user?.id;
    if (!email || !userId) return ApiErrors.unauthorized();

    const env = getCurrentEnvironment();
    const user = await getUserById(userId, env);
    if (!user) return ApiErrors.notFound("User");

    return successResponse({
      email: user.email,
      name: user.name,
      display_name: user.display_name,
      initials: user.initials,
      avatar_url: user.avatar_url,
    });
  } catch (e) {
    console.error("[user/profile GET]", e);
    return ApiErrors.serverError();
  }
}

export async function PATCH(request: Request) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    const email = session?.user?.email;
    const userId = session?.user?.id;
    if (!email || !userId) return ApiErrors.unauthorized();

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const displayName =
      typeof body.display_name === "string" ? body.display_name.trim() : undefined;
    const initialsRaw =
      typeof body.initials === "string" ? body.initials.trim().toUpperCase() : undefined;
    const initials = initialsRaw !== undefined ? initialsRaw.slice(0, 3) : undefined;

    if (name !== undefined && !name) {
      return ApiErrors.validationError("Full name is required");
    }
    if (displayName !== undefined && !displayName) {
      return ApiErrors.validationError("Display name is required");
    }
    if (initials !== undefined) {
      if (!initials || !INITIALS_RE.test(initials)) {
        return ApiErrors.validationError("Initials must be 1–3 letters or numbers");
      }
    }

    if (
      name === undefined &&
      displayName === undefined &&
      initials === undefined
    ) {
      return ApiErrors.validationError("No profile fields to update");
    }

    const env = getCurrentEnvironment();
    await updateProfile({
      userId,
      environment: env,
      ...(name !== undefined ? { name } : {}),
      ...(displayName !== undefined ? { displayName } : {}),
      ...(initials !== undefined ? { initials } : {}),
    });
    return successResponse({ ok: true });
  } catch (e) {
    console.error("[user/profile PATCH]", e);
    return ApiErrors.serverError();
  }
}
