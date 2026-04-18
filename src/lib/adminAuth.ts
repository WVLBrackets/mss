import type { Session } from "next-auth";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/constants";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { getUserByEmail } from "@/lib/repositories/userRepository";

/**
 * Returns true if the email is the hard-coded bootstrap admin (case-insensitive).
 */
export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
}

/**
 * Admin if bootstrap email or persisted `is_admin` in DB for current environment.
 */
export async function isUserAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (isBootstrapAdminEmail(email)) return true;
  const env = getCurrentEnvironment();
  const user = await getUserByEmail(email, env);
  return Boolean(user?.is_admin);
}

/**
 * Returns true when session represents an admin user.
 */
export async function isSessionAdmin(session: Session | null): Promise<boolean> {
  const email = session?.user?.email;
  return isUserAdmin(email);
}
