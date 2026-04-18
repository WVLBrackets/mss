import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { deleteUser, getUserById } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors } from "@/lib/api/responses";
import { isBootstrapAdminEmail } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    if (!(await isSessionAdmin(session))) return ApiErrors.forbidden();

    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const protectConfirmed = Boolean(body.protectConfirmed);
    const env = getCurrentEnvironment();

    for (const id of ids) {
      const u = await getUserById(id, env);
      if (!u) continue;
      if (isBootstrapAdminEmail(u.email)) continue;
      if (protectConfirmed && u.email_confirmed) continue;
      await deleteUser(id, env);
    }

    return successResponse({ ok: true });
  } catch (e) {
    console.error("[admin/users/bulk-delete]", e);
    return ApiErrors.serverError();
  }
}
