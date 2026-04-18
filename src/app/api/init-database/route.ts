import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { initializeDatabase, ensureBootstrapDevUser } from "@/lib/database/migrations";
import { successResponse, ApiErrors } from "@/lib/api/responses";

export async function GET(request: Request) {
  return runInit(request);
}

export async function POST(request: Request) {
  return runInit(request);
}

async function runInit(request: Request) {
  try {
    const bootstrap = process.env.DATABASE_BOOTSTRAP_SECRET;
    const hdr = request.headers.get("x-database-bootstrap-secret");
    const session = await getAuthSession();
    const admin = await isSessionAdmin(session);
    const secretOk = Boolean(bootstrap && hdr === bootstrap);
    if (!admin && !secretOk) {
      return ApiErrors.forbidden();
    }
    await initializeDatabase();
    await ensureBootstrapDevUser();
    return successResponse({ initialized: true }, "Database initialized");
  } catch (e) {
    console.error("[init-database]", e);
    return ApiErrors.serverError();
  }
}
