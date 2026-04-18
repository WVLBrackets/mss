import { getAuthSession } from "@/lib/auth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { updateProfile } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors } from "@/lib/api/responses";

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
    if (name !== undefined && !name) {
      return ApiErrors.validationError("Name is required");
    }

    const env = getCurrentEnvironment();
    await updateProfile({ userId, environment: env, name });
    return successResponse({ ok: true });
  } catch (e) {
    console.error("[user/profile]", e);
    return ApiErrors.serverError();
  }
}
