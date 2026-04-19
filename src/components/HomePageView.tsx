import { getAuthSession } from "@/lib/auth";
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
  const name =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.trim() ||
    "there";

  const raw = authed
    ? cfg.welcome_greeting_logged_in
    : cfg.welcome_greeting_logged_out;
  const greeting = raw.replace(/\{name\}/g, name);

  return (
    <div className="text-2xl font-semibold text-neutral-900 whitespace-pre-line">
      {greeting}
    </div>
  );
}
