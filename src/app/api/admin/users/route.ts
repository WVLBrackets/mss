import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { listUsers } from "@/lib/repositories/userRepository";
import { successResponse, ApiErrors } from "@/lib/api/responses";
import { isBootstrapAdminEmail } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!(await isSessionAdmin(session))) return ApiErrors.forbidden();

    const url = new URL(request.url);
    const unconfirmed = url.searchParams.get("unconfirmed") === "1";
    const search = url.searchParams.get("search")?.toLowerCase().trim() ?? "";

    const env = getCurrentEnvironment();
    let users = await listUsers(env);
    if (unconfirmed) {
      users = users.filter((u) => !u.email_confirmed);
    }
    if (search) {
      users = users.filter((u) => {
        const role = u.is_admin || isBootstrapAdminEmail(u.email) ? "admin" : "user";
        const hay = [
          u.name,
          u.email,
          role,
          u.created_at?.toString?.() ?? "",
          u.last_login?.toString?.() ?? "never",
          u.email_confirmed ? "confirmed" : "unconfirmed",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(search);
      });
    }

    const payload = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.is_admin || isBootstrapAdminEmail(u.email) ? "Admin" : "User",
      emailConfirmed: u.email_confirmed,
      createdAt: u.created_at,
      lastLogin: u.last_login,
      avatarUrl: u.avatar_url,
    }));

    return successResponse(payload);
  } catch (e) {
    console.error("[admin/users GET]", e);
    return ApiErrors.serverError();
  }
}
