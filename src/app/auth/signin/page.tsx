"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SiteConfig } from "@/lib/siteConfig";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/constants";

export default function SignInPageWrapper() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
      <SignInPageInner />
    </Suspense>
  );
}

function SignInPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    void fetch("/api/site-config")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setSiteConfig(j.data as SiteConfig);
      })
      .catch(() => {});
  }, []);

  const devBypass =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      setMessage(data.message ?? "Check your email to confirm.");
    } finally {
      setBusy(false);
    }
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const devEmail =
        process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL || BOOTSTRAP_ADMIN_EMAIL;
      const res = await signIn("credentials", {
        email: devBypass ? devEmail : email,
        password: devBypass ? "dev" : password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password, or email not confirmed.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const confirmed = sp.get("confirmed") === "1";
  const resetOk = sp.get("reset") === "ok";
  const qpError = sp.get("error");

  return (
    <div className="mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex gap-2 border-b border-neutral-100 pb-3">
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
            mode === "signin" ? "bg-neutral-900 text-white" : "bg-neutral-100"
          }`}
          onClick={() => setMode("signin")}
          data-testid="auth-tab-signin"
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
            mode === "register" ? "bg-neutral-900 text-white" : "bg-neutral-100"
          }`}
          onClick={() => setMode("register")}
          data-testid="auth-tab-register"
        >
          Create account
        </button>
      </div>

      {devBypass ? (
        <p className="mt-3 rounded bg-orange-50 p-2 text-xs text-orange-900">
          Local dev: auth bypass is on. Sign in uses the dev admin user without real credentials.
          Use staging/preview to exercise registration and email confirmation end-to-end.
        </p>
      ) : null}

      {confirmed ? (
        <p className="mt-3 text-sm text-green-700">Email confirmed. You can sign in.</p>
      ) : null}
      {resetOk ? (
        <p className="mt-3 text-sm text-green-700">Password updated. You can sign in.</p>
      ) : null}
      {qpError ? (
        <p className="mt-3 text-sm text-red-600">Link error: {qpError.replace(/_/g, " ")}</p>
      ) : null}

      {mode === "signin" ? (
        <form className="mt-4 space-y-3" onSubmit={onSignIn}>
          {!devBypass ? (
            <>
              <label className="block text-sm">
                Email
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="signin-email"
                  required
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="signin-password"
                  required
                />
              </label>
            </>
          ) : (
            <p className="text-sm text-neutral-600">Click below to continue as the local dev user.</p>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
            data-testid="signin-submit"
          >
            Sign in
          </button>
          {!devBypass ? (
            <p className="text-center text-sm">
              <Link href="/auth/forgot-password" className="text-blue-600 underline">
                Forgot password
              </Link>
            </p>
          ) : null}
          {siteConfig ? (
            <p className="whitespace-pre-line text-xs text-neutral-500">{siteConfig.signin_welcome}</p>
          ) : null}
        </form>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={onRegister}>
          {devBypass ? (
            <p className="text-sm text-neutral-600">
              Turn off <code className="text-xs">DEV_AUTH_BYPASS</code> locally to test registration
              against your database.
            </p>
          ) : (
            <>
              <label className="block text-sm">
                Name
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="register-name"
                  required
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="register-email"
                  required
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="register-password"
                  required
                />
              </label>
              <label className="block text-sm">
                Confirm password
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="register-confirm-password"
                  required
                />
              </label>
            </>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {!devBypass ? (
            <button
              type="submit"
              className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={busy}
              data-testid="register-submit"
            >
              Create account
            </button>
          ) : null}
          {siteConfig ? (
            <p className="whitespace-pre-line text-xs text-neutral-500">{siteConfig.signup_welcome}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}
