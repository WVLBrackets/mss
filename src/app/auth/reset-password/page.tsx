"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      router.push("/auth/signin?reset=ok");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Missing token. <Link href="/auth/forgot-password">Request a new link</Link>.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold">Reset password</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm" htmlFor="reset-password-field">
          New password
          <div className="relative mt-1">
            <input
              id="reset-password-field"
              className="w-full rounded border border-neutral-300 py-1.5 pl-2 pr-10 text-sm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="reset-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </label>
        <label className="block text-sm" htmlFor="reset-confirm-password-field">
          Confirm password
          <div className="relative mt-1">
            <input
              id="reset-confirm-password-field"
              className="w-full rounded border border-neutral-300 py-1.5 pl-2 pr-10 text-sm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              data-testid="reset-confirm-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              title={showConfirm ? "Hide confirm password" : "Show confirm password"}
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded bg-neutral-900 py-2 text-sm text-white disabled:opacity-50"
          disabled={busy}
          data-testid="reset-submit"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
