import { getAuthSession } from "@/lib/auth";
import { loadSiteConfig, isSiteConfigError } from "@/lib/siteConfig";

export default async function HomePage() {
  const session = await getAuthSession();
  const cfg = await loadSiteConfig();
  if (isSiteConfigError(cfg)) {
    return null;
  }
  const name =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.trim() ||
    "there";
  const greeting = cfg.welcome_greeting.replace(/\{name\}/g, name);

  return (
    <div className="text-2xl font-semibold text-neutral-900 whitespace-pre-line">
      {greeting}
    </div>
  );
}
