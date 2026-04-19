import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  deleteUser,
  getUserById,
  updateUserAdminFields,
} from "@/lib/repositories/userRepository";

const INITIALS_RE = /^[A-Za-z0-9]{1,3}$/;
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors } from "@/lib/api/responses";
import { isBootstrapAdminEmail } from "@/lib/adminAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    if (!(await isSessionAdmin(session))) return ApiErrors.forbidden();

    const { id } = await params;
    const env = getCurrentEnvironment();
    const existing = await getUserById(id, env);
    if (!existing) return ApiErrors.notFound("User");

    const body = await request.json();
    if (body.email !== undefined && isBootstrapAdminEmail(existing.email)) {
      return ApiErrors.validationError("Cannot change bootstrap admin email");
    }
    if (body.isAdmin === false && isBootstrapAdminEmail(existing.email)) {
      return ApiErrors.validationError("Cannot remove admin from bootstrap account");
    }

    if (body.name !== undefined && typeof body.name === "string" && !body.name.trim()) {
      return ApiErrors.validationError("Full name is required");
    }
    if (
      body.display_name !== undefined &&
      typeof body.display_name === "string" &&
      !body.display_name.trim()
    ) {
      return ApiErrors.validationError("Display name is required");
    }
    if (body.initials !== undefined) {
      const ini =
        typeof body.initials === "string"
          ? body.initials.trim().toUpperCase().slice(0, 3)
          : "";
      if (!ini || !INITIALS_RE.test(ini)) {
        return ApiErrors.validationError("Initials must be 1–3 letters or numbers");
      }
    }

    await updateUserAdminFields({
      userId: id,
      environment: env,
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      displayName:
        typeof body.display_name === "string" ? body.display_name.trim() : undefined,
      initials:
        typeof body.initials === "string"
          ? body.initials.trim().toUpperCase().slice(0, 3)
          : undefined,
      avatarUrl:
        body.avatar_url === null
          ? null
          : typeof body.avatar_url === "string"
            ? body.avatar_url
            : undefined,
      email: typeof body.email === "string" ? body.email.trim() : undefined,
      isAdmin: typeof body.isAdmin === "boolean" ? body.isAdmin : undefined,
    });

    return successResponse({ ok: true });
  } catch (e) {
    console.error("[admin/users PATCH]", e);
    return ApiErrors.serverError();
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    if (!(await isSessionAdmin(session))) return ApiErrors.forbidden();

    const { id } = await params;
    const env = getCurrentEnvironment();
    const u = await getUserById(id, env);
    if (!u) return ApiErrors.notFound("User");
    if (isBootstrapAdminEmail(u.email)) {
      return ApiErrors.validationError("Cannot delete bootstrap admin");
    }

    const url = new URL(request.url);
    const protectConfirmed = url.searchParams.get("protect_confirmed") === "1";
    if (protectConfirmed && u.email_confirmed) {
      return ApiErrors.validationError("Cannot delete confirmed user while protection is on");
    }

    await deleteUser(id, env);
    return successResponse({ ok: true });
  } catch (e) {
    console.error("[admin/users DELETE]", e);
    return ApiErrors.serverError();
  }
}
