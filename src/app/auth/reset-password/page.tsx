"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
        <label className="block text-sm">
          New password
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="reset-password"
          />
        </label>
        <label className="block text-sm">
          Confirm password
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            data-testid="reset-confirm-password"
          />
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
