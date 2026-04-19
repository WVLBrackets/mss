import { put } from "@vercel/blob";
import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  formatStoredAvatarFromPut,
  getBlobStoreAccess,
} from "@/lib/blobAvatar";
import { getUserById, updateProfile } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors } from "@/lib/api/responses";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    if (!(await isSessionAdmin(session))) return ApiErrors.forbidden();

    const { id: targetUserId } = await params;
    const env = getCurrentEnvironment();
    const target = await getUserById(targetUserId, env);
    if (!target) return ApiErrors.notFound("User");

    const token = process.env["BLOB_READ_WRITE_TOKEN"];
    if (!token) {
      return ApiErrors.validationError("Avatar upload is not configured (BLOB_READ_WRITE_TOKEN)");
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return ApiErrors.validationError("file is required");
    }
    if (file.size > MAX_BYTES) {
      return ApiErrors.validationError("File too large (max 2MB)");
    }
    const type = file.type;
    if (!ALLOWED.has(type)) {
      return ApiErrors.validationError("Unsupported file type");
    }

    const ext = type.split("/")[1] ?? "bin";
    const pathname = `avatars/admin-${targetUserId}-${Date.now()}.${ext}`;
    const access = getBlobStoreAccess();
    const blob = await put(pathname, file, {
      access,
      token,
    });

    const stored = formatStoredAvatarFromPut(access, blob);
    await updateProfile({
      userId: targetUserId,
      environment: env,
      avatarUrl: stored,
    });
    return successResponse({ url: stored });
  } catch (e) {
    console.error("[admin/users/avatar POST]", e);
    return ApiErrors.serverError();
  }
}
