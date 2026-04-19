import { put } from "@vercel/blob";
import { getAuthSession } from "@/lib/auth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  formatStoredAvatarFromPut,
  getBlobStoreAccess,
} from "@/lib/blobAvatar";
import { getUserById, updateProfile } from "@/lib/repositories/userRepository";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, ApiErrors, errorResponse } from "@/lib/api/responses";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    const csrf = csrfProtection(request);
    if (csrf) return csrf;

    const session = await getAuthSession();
    const userId = session?.user?.id;
    if (!userId) return ApiErrors.unauthorized();

    const env = getCurrentEnvironment();
    const row = await getUserById(userId, env);
    if (!row) return ApiErrors.notFound("User");
    if (row.profile_locked) {
      return errorResponse(
        "Your profile has been locked by an administrator.",
        403,
        "PROFILE_LOCKED",
      );
    }

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
    const pathname = `avatars/${userId}-${Date.now()}.${ext}`;
    const access = getBlobStoreAccess();
    const blob = await put(pathname, file, {
      access,
      token,
    });

    const stored = formatStoredAvatarFromPut(access, blob);
    await updateProfile({ userId, environment: env, avatarUrl: stored });
    return successResponse({ url: stored });
  } catch (e) {
    console.error("[user/avatar]", e);
    return ApiErrors.serverError();
  }
}
