"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Shield, UserCircle } from "lucide-react";
import { useState } from "react";
import type { SiteConfig } from "@/lib/siteConfig";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import { ProfileModal } from "@/components/ProfileModal";

type BannerKind = "none" | "staging" | "local";

interface Props {
  siteConfig: SiteConfig;
  bannerKind: BannerKind;
  children: React.ReactNode;
}

export function AppShell({ siteConfig, bannerKind, children }: Props) {
  const pathname = usePathname();
  const { data: session, status, update } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = Boolean(session?.user?.isAdmin);
  const isAuthed = status === "authenticated";

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <EnvironmentBanner kind={bannerKind} />
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.site_logo_url}
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
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {!isAuthed ? (
              <Link
                href="/auth/signin"
                className="flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                data-testid="login-link"
              >
                <span>Login</span>
                <UserCircle className="h-6 w-6" aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400"
                title={siteConfig.profile_hover}
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium">
                    {(session?.user?.name ?? session?.user?.email ?? "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 border-t border-neutral-100 px-2">
          <NavItem href="/" icon={<Home className="h-4 w-4" />} label="Home" active={pathname === "/"} />
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
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        siteConfig={siteConfig}
        userName={session?.user?.name ?? ""}
        userEmail={session?.user?.email ?? ""}
        avatarUrl={session?.user?.image ?? null}
        onUpdated={() => void update()}
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
