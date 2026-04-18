import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { getUserById, updatePassword } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { validatePassword } from "@/lib/validation/validators";
import { hashPassword } from "@/lib/services/authService";
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

    const body = await request.json();
    const pv = validatePassword(body.password);
    if (!pv.valid) return ApiErrors.validationError(pv.error!);

    const hash = await hashPassword(body.password);
    await updatePassword(id, env, hash);
    return successResponse({ ok: true });
  } catch (e) {
    console.error("[admin/password]", e);
    return ApiErrors.serverError();
  }
}
