"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import type { SiteConfig } from "@/lib/siteConfig";
import { parseConfigButton } from "@/lib/configButton";
import {
  placeholdersFromSessionUser,
  resolveUserPlaceholders,
} from "@/lib/configPlaceholders";

type Phase = "signing_in" | "ready" | "error";

export function AccountConfirmedClient({
  siteConfig,
  handoffToken,
}: {
  siteConfig: SiteConfig;
  handoffToken: string;
}) {
  const [phase, setPhase] = useState<Phase>(() => (handoffToken ? "signing_in" : "error"));
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (!handoffToken) return;
    let cancelled = false;
    void (async () => {
      const r = await signIn("credentials", {
        handoffToken,
        redirect: false,
        callbackUrl: "/",
      });
      if (cancelled) return;
      if (r?.error) {
        setSessionError(
          "We could not sign you in automatically. Please use Login.",
        );
        setPhase("error");
        return;
      }
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [handoffToken]);

  if (phase === "signing_in") {
    return (
      <div className="max-w-3xl">
        <p className="text-neutral-600">Completing sign-in…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-3xl space-y-3">
        {!handoffToken ? (
          <p className="text-neutral-700">
            This confirmation link is invalid or incomplete.
          </p>
        ) : (
          <p className="text-red-700">
            {sessionError ?? "Something went wrong."}
          </p>
        )}
        <Link
          href="/auth/signin"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (sessionStatus === "loading" || !session?.user) {
    return (
      <div className="max-w-3xl">
        <p className="text-neutral-600">Completing sign-in…</p>
      </div>
    );
  }

  const placeholders = placeholdersFromSessionUser(session.user);

  const header = resolveUserPlaceholders(
    siteConfig.acct_confirm_success_header,
    placeholders,
  );
  const message1 = resolveUserPlaceholders(
    siteConfig.acct_confirm_success_message1,
    placeholders,
  );
  const b1 = parseConfigButton(
    resolveUserPlaceholders(siteConfig.acct_confirm_success_button1, placeholders),
  );
  const b2 = parseConfigButton(
    resolveUserPlaceholders(siteConfig.acct_confirm_success_button2, placeholders),
  );

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-900">{header}</h1>
      <p className="whitespace-pre-line text-pretty text-neutral-700">{message1}</p>
      <div className="flex flex-wrap gap-3 pt-2">
        {b1 !== "hidden" ? <NavButton label={b1.label} href={b1.path} /> : null}
        {b2 !== "hidden" ? <NavButton label={b2.label} href={b2.path} /> : null}
      </div>
    </div>
  );
}

function NavButton({ label, href }: { label: string; href: string }) {
  const cls =
    "inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800";
  if (href.startsWith("http")) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}
