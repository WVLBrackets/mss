"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Shield, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  placeholdersFromSessionUser,
  resolveUserPlaceholders,
} from "@/lib/configPlaceholders";
import { publicAssetUrl, type SiteConfig } from "@/lib/siteConfig";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import { ProfileModal } from "@/components/ProfileModal";
import { SiteFooter, type DeploymentFooterMeta } from "@/components/SiteFooter";

type BannerKind = "none" | "staging" | "local";

interface Props {
  siteConfig: SiteConfig;
  bannerKind: BannerKind;
  deployment: DeploymentFooterMeta;
  children: React.ReactNode;
}

export function AppShell({ siteConfig, bannerKind, deployment, children }: Props) {
  const pathname = usePathname();
  const { data: session, status, update } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = Boolean(session?.user?.isAdmin);
  const isAuthed = status === "authenticated";
  const profileLocked = Boolean(session?.user?.profileLocked);

  useEffect(() => {
    if (profileLocked && profileOpen) setProfileOpen(false);
  }, [profileLocked, profileOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <EnvironmentBanner kind={bannerKind} />
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 cursor-default items-center gap-3 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicAssetUrl(siteConfig.site_logo)}
              alt=""
              className="h-9 w-9 shrink-0 rounded object-contain"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold leading-tight">
                {siteConfig.site_name}
              </div>
              <div className="truncate text-xs text-neutral-500">
                {siteConfig.site_subtitle}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isAuthed ? (
              <Link
                href="/auth/signin"
                className="flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                data-testid="login-link"
              >
                <span>Profile</span>
                <UserCircle className="h-6 w-6" aria-hidden />
              </Link>
            ) : profileLocked ? (
              <span
                role="img"
                aria-label="Profile (locked)"
                className="cursor-not-allowed rounded-full opacity-60 focus:outline-none"
                title="Your profile has been locked by an administrator."
                data-testid="profile-avatar-button-locked"
              >
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-sm font-semibold text-white">
                    {(session?.user?.initials?.slice(0, 3) ??
                      session?.user?.name ??
                      session?.user?.email ??
                      "?")
                      .toString()
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                )}
              </span>
            ) : (
              <button
                type="button"
                className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400"
                title={resolveUserPlaceholders(
                  siteConfig.profile_hover,
                  placeholdersFromSessionUser(session?.user ?? {}),
                )}
                onClick={() => setProfileOpen(true)}
                data-testid="profile-avatar-button"
              >
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-sm font-semibold text-white">
                    {(session?.user?.initials?.slice(0, 3) ??
                      session?.user?.name ??
                      session?.user?.email ??
                      "?")
                      .toString()
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 border-t border-neutral-100 px-2">
          <NavItem
            href="/home"
            icon={<Home className="h-4 w-4" />}
            label="Home"
            active={pathname === "/" || pathname === "/home"}
          />
          {isAdmin ? (
            <NavItem
              href="/admin"
              icon={<Shield className="h-4 w-4" />}
              label="Admin"
              active={pathname.startsWith("/admin")}
            />
          ) : null}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter siteConfig={siteConfig} deployment={deployment} />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onUpdated={async () => {
          await update();
        }}
      />
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      data-testid={`nav-${label.toLowerCase()}`}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${
        active ? "border-b-2 border-neutral-900 text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
