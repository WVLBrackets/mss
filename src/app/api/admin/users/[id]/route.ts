import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  deleteUser,
  getUserById,
  updateUserAdminFields,
} from "@/lib/repositories/userRepository";
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
    if (body.email && isBootstrapAdminEmail(existing.email)) {
      return ApiErrors.validationError("Cannot change bootstrap admin email");
    }
    if (body.isAdmin === false && isBootstrapAdminEmail(existing.email)) {
      return ApiErrors.validationError("Cannot remove admin from bootstrap account");
    }

    await updateUserAdminFields({
      userId: id,
      environment: env,
      name: body.name,
      email: body.email,
      isAdmin: body.isAdmin,
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
