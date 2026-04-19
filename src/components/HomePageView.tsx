import { getAuthSession } from "@/lib/auth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import {
  ANONYMOUS_USER_PLACEHOLDERS,
  placeholdersFromSessionUser,
  resolveUserPlaceholders,
} from "@/lib/configPlaceholders";
import { getUserById } from "@/lib/repositories/userRepository";
import { loadSiteConfig, isSiteConfigError } from "@/lib/siteConfig";

/**
 * Shared home content for `/` and `/home`.
 */
export async function HomePageView() {
  const session = await getAuthSession();
  const cfg = await loadSiteConfig();
  if (isSiteConfigError(cfg)) {
    return null;
  }

  const authed = Boolean(session?.user);
  let placeholders = ANONYMOUS_USER_PLACEHOLDERS;

  if (authed && session?.user?.id) {
    const env = getCurrentEnvironment();
    const row = await getUserById(session.user.id, env);
    if (row) {
      placeholders = {
        fullName: row.name,
        displayName: row.display_name,
        initials: row.initials,
      };
    } else {
      placeholders = placeholdersFromSessionUser(session.user);
    }
  }

  const raw = authed
    ? cfg.welcome_greeting_logged_in
    : cfg.welcome_greeting_logged_out;
  const greeting = resolveUserPlaceholders(raw, placeholders);

  return (
    <div className="text-2xl font-semibold text-neutral-900 whitespace-pre-line">
      {greeting}
    </div>
  );
}
