import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { getUserById, updateUserConfirmation } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors } from "@/lib/api/responses";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    if (!(await isSessionAdmin(session))) return ApiErrors.forbidden();

    const { id } = await params;
    const env = getCurrentEnvironment();
    const u = await getUserById(id, env);
    if (!u) return ApiErrors.notFound("User");

    await updateUserConfirmation(id, env);
    return successResponse({ ok: true });
  } catch (e) {
    console.error("[admin/confirm]", e);
    return ApiErrors.serverError();
  }
}
