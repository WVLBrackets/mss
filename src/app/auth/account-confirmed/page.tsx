import { redirect } from "next/navigation";
import { loadSiteConfig, isSiteConfigError } from "@/lib/siteConfig";
import { AccountConfirmedClient } from "./AccountConfirmedClient";

export default async function AccountConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ h?: string }>;
}) {
  const cfg = await loadSiteConfig();
  if (isSiteConfigError(cfg)) {
    redirect("/auth/signin");
  }
  const sp = await searchParams;
  return <AccountConfirmedClient siteConfig={cfg} handoffToken={sp.h ?? ""} />;
}
