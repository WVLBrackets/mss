"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { SiteConfig } from "@/lib/siteConfig";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/constants";
import {
  ANONYMOUS_USER_PLACEHOLDERS,
  resolveUserPlaceholders,
} from "@/lib/configPlaceholders";

export default function SignInPageWrapper() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
      <SignInPageInner />
    </Suspense>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  "data-testid"?: string;
  required?: boolean;
};

/**
 * Password input with a toggle to show or hide the value (eye control on the right).
 */
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  "data-testid": dataTestId,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm" htmlFor={id}>
      {label}
      <div className="relative mt-1">
        <input
          id={id}
          className="w-full rounded border border-neutral-300 py-1.5 pl-2 pr-10 text-sm"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={dataTestId}
          required={required}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r border-l border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </label>
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

  function switchMode(next: "signin" | "register") {
    setMode(next);
    setError(null);
    setMessage(null);
  }

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
      const msg =
        typeof data.message === "string" && data.message.trim()
          ? data.message
          : siteConfig?.sign_up_confirm ?? "";
      setMessage(msg);
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

  const signinWelcome =
    siteConfig &&
    resolveUserPlaceholders(siteConfig.signin_welcome, ANONYMOUS_USER_PLACEHOLDERS);
  const signupWelcome =
    siteConfig &&
    resolveUserPlaceholders(siteConfig.signup_welcome, ANONYMOUS_USER_PLACEHOLDERS);

  return (
    <div className="mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex gap-2 border-b border-neutral-100 pb-3">
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
            mode === "signin" ? "bg-neutral-900 text-white" : "bg-neutral-100"
          }`}
          onClick={() => switchMode("signin")}
          data-testid="auth-tab-signin"
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
            mode === "register" ? "bg-neutral-900 text-white" : "bg-neutral-100"
          }`}
          onClick={() => switchMode("register")}
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
        <>
          <form className="mt-4 space-y-3" onSubmit={onSignIn} autoComplete="on">
            {!devBypass ? (
              <>
                <label className="block text-sm" htmlFor="signin-email-input">
                  Email
                  <input
                    id="signin-email-input"
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="signin-email"
                    required
                  />
                </label>
                <PasswordField
                  id="signin-password-input"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  data-testid="signin-password"
                />
              </>
            ) : (
              <p className="text-sm text-neutral-600">Click below to continue as the local dev user.</p>
            )}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              className="w-full cursor-pointer rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
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
          </form>
          {signinWelcome ? (
            <p className="mt-3 whitespace-pre-line text-xs text-neutral-500">{signinWelcome}</p>
          ) : null}
        </>
      ) : (
        <>
          <form
            className="mt-4 space-y-3"
            onSubmit={onRegister}
            autoComplete="off"
            data-lpignore="true"
          >
            {devBypass ? (
              <p className="text-sm text-neutral-600">
                Turn off <code className="text-xs">DEV_AUTH_BYPASS</code> locally to test registration
                against your database.
              </p>
            ) : (
              <>
                <label className="block text-sm" htmlFor="register-name-input">
                  Name
                  <input
                    id="register-name-input"
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                    autoComplete="off"
                    name="full_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="register-name"
                    required
                  />
                </label>
                <label className="block text-sm" htmlFor="register-email-input">
                  Email
                  <input
                    id="register-email-input"
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                    type="email"
                    autoComplete="off"
                    name="signup_email_field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="register-email"
                    required
                  />
                </label>
                <PasswordField
                  id="register-password-input"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  data-testid="register-password"
                />
                <PasswordField
                  id="register-confirm-password-input"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  data-testid="register-confirm-password"
                />
              </>
            )}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
            {!devBypass ? (
              <button
                type="submit"
                className="w-full cursor-pointer rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={busy}
                data-testid="register-submit"
              >
                Create account
              </button>
            ) : null}
          </form>
          {signupWelcome ? (
            <p className="mt-3 whitespace-pre-line text-xs text-neutral-500">{signupWelcome}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
