"use client";

import { useState } from "react";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";
import type { SiteConfig } from "@/lib/siteConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  siteConfig: SiteConfig;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  onUpdated: () => void;
}

export function ProfileModal({
  open,
  onClose,
  siteConfig,
  userName,
  userEmail,
  avatarUrl,
  onUpdated,
}: Props) {
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function saveName() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithCsrf("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
      const json = await csrfRes.json();
      const token = json?.data?.token as string;
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": token },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="profile-modal"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        <p className="mt-1 text-sm text-neutral-500">{userEmail}</p>
        <label className="mt-4 block text-sm font-medium text-neutral-700">
          Display name
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="profile-name-input"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-neutral-700">
          Avatar
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 block w-full text-sm"
            onChange={onAvatarChange}
            disabled={saving}
            data-testid="profile-avatar-input"
          />
        </label>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="mt-2 h-16 w-16 rounded-full object-cover"
          />
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border border-neutral-300 px-4 py-2 text-sm"
            onClick={onClose}
            data-testid="profile-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={saveName}
            disabled={saving}
            data-testid="profile-save-button"
          >
            Save name
          </button>
        </div>
        <p className="mt-4 text-xs text-neutral-400">{siteConfig.profile_hover}</p>
      </div>
    </div>
  );
}
