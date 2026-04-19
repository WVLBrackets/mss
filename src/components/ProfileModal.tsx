"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, X } from "lucide-react";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";
import { avatarSrcForImg } from "@/lib/blobAvatar";

type ProfilePayload = {
  email: string;
  name: string;
  display_name: string;
  initials: string;
  avatar_url: string | null;
  avatar_upload_available?: boolean;
};

type Snapshot = {
  name: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

/**
 * Profile editor: full/display name, initials, avatar upload; save/cancel, logout, unsaved guards.
 */
export function ProfileModal({ open, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("");
  const [serverAvatarUrl, setServerAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  /** True when the user chose Remove; saved avatar is hidden until Save (or cleared on Cancel). */
  const [pendingAvatarRemoval, setPendingAvatarRemoval] = useState(false);
  const [uploadAvailable, setUploadAvailable] = useState(true);

  const snapshot = useRef<Snapshot | null>(null);
  const [pendingExit, setPendingExit] = useState<null | "close" | "logout">(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFromSnapshot = useCallback(() => {
    const s = snapshot.current;
    if (!s) return;
    setFullName(s.name);
    setDisplayName(s.displayName);
    setInitials(s.initials);
    setServerAvatarUrl(s.avatarUrl);
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingFile(null);
    setPendingAvatarRemoval(false);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        setError(json.error ?? "Could not load profile");
        return;
      }
      const d = json.data as ProfilePayload;
      setEmail(d.email);
      setFullName(d.name);
      setDisplayName(d.display_name);
      setInitials(d.initials);
      setServerAvatarUrl(d.avatar_url);
      setUploadAvailable(d.avatar_upload_available !== false);
      snapshot.current = {
        name: d.name,
        displayName: d.display_name,
        initials: d.initials,
        avatarUrl: d.avatar_url,
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setPendingExit(null);
    void loadProfile();
  }, [open, loadProfile]);

  const dirty =
    snapshot.current !== null &&
    (fullName.trim() !== snapshot.current.name ||
      displayName.trim() !== snapshot.current.displayName ||
      initials.trim().toUpperCase() !== snapshot.current.initials.toUpperCase() ||
      pendingFile !== null ||
      pendingAvatarRemoval);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!uploadAvailable) {
      setError(
        "Image upload is not enabled on the server. Add BLOB_READ_WRITE_TOKEN in Vercel (Preview + Production) for this project.",
      );
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    const url = URL.createObjectURL(file);
    setPendingPreviewUrl(url);
    setPendingFile(file);
    setPendingAvatarRemoval(false);
  }

  function onRemoveAvatarClick() {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
      setPendingFile(null);
    }
    if (serverAvatarUrl) {
      setPendingAvatarRemoval(true);
    }
  }

  async function postAvatar(file: File): Promise<string | null> {
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
      setError(data.error ?? "Avatar upload failed");
      return null;
    }
    const url = data?.data?.url as string | undefined;
    if (url) setServerAvatarUrl(url);
    return url ?? null;
  }

  async function saveAll(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      let nextAvatarUrl = serverAvatarUrl;
      let uploadedNewAvatarThisSave = false;
      if (pendingFile) {
        if (!uploadAvailable) {
          setError(
            "Cannot save image: BLOB_READ_WRITE_TOKEN is not set for this deployment.",
          );
          return false;
        }
        const uploaded = await postAvatar(pendingFile);
        if (!uploaded) return false;
        nextAvatarUrl = uploaded;
        uploadedNewAvatarThisSave = true;
        setPendingPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setPendingFile(null);
      } else if (pendingAvatarRemoval) {
        nextAvatarUrl = null;
      }

      const res = await fetchWithCsrf("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          display_name: displayName.trim(),
          initials: initials.trim().toUpperCase().slice(0, 3),
          ...(pendingAvatarRemoval && !uploadedNewAvatarThisSave
            ? { remove_avatar: true }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return false;
      }
      snapshot.current = {
        name: fullName.trim(),
        displayName: displayName.trim(),
        initials: initials.trim().toUpperCase().slice(0, 3),
        avatarUrl: nextAvatarUrl,
      };
      setServerAvatarUrl(nextAvatarUrl);
      setPendingAvatarRemoval(false);
      await Promise.resolve(onUpdated());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleCloseAttempt() {
    if (dirty) setPendingExit("close");
    else onClose();
  }

  function handleLogoutAttempt() {
    if (dirty) setPendingExit("logout");
    else void signOut({ callbackUrl: "/" });
  }

  async function saveThenExit() {
    const action = pendingExit;
    const ok = await saveAll();
    if (!ok) return;
    setPendingExit(null);
    if (action === "logout") {
      await signOut({ callbackUrl: "/" });
    } else {
      onClose();
    }
  }

  function discardThenExit() {
    const action = pendingExit;
    resetFromSnapshot();
    setPendingExit(null);
    if (action === "logout") {
      void signOut({ callbackUrl: "/" });
    } else {
      onClose();
    }
  }

  async function onSaveClick() {
    const ok = await saveAll();
    if (ok) onClose();
  }

  function onCancelClick() {
    resetFromSnapshot();
    onClose();
  }

  if (!open) return null;

  const showAvatarImage = Boolean(
    pendingPreviewUrl || (serverAvatarUrl && !pendingAvatarRemoval),
  );
  const avatarSrc =
    pendingPreviewUrl ?? avatarSrcForImg("self", serverAvatarUrl) ?? "";
  const initialsDisplay = initials.trim().toUpperCase().slice(0, 3) || "?";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="profile-modal"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-lg">
        {pendingExit ? (
          <div className="absolute inset-0 z-[60] flex items-center justify-center rounded-lg bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
              <p className="text-sm font-medium text-neutral-900">Unsaved changes</p>
              <p className="mt-1 text-sm text-neutral-600">
                Save your updates, or discard them
                {pendingExit === "logout" ? " before signing out" : " before closing"}.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  onClick={() => void saveThenExit()}
                  disabled={saving}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  onClick={discardThenExit}
                  disabled={saving}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  onClick={() => setPendingExit(null)}
                  disabled={saving}
                >
                  Stay
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
          <button
            type="button"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
            onClick={handleCloseAttempt}
            data-testid="profile-modal-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[min(80vh,640px)] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void onSaveClick();
              }}
            >
              <p className="text-sm text-neutral-500">{email}</p>

              <label className="block text-sm font-medium text-neutral-700">
                Full name
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  data-testid="profile-full-name"
                />
              </label>

              <label className="block text-sm font-medium text-neutral-700">
                Display name
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  data-testid="profile-display-name"
                />
              </label>

              <label className="block text-sm font-medium text-neutral-700">
                Initial(s) (up to 3)
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm uppercase"
                  value={initials}
                  maxLength={3}
                  onChange={(e) =>
                    setInitials(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 3),
                    )
                  }
                  data-testid="profile-initials"
                />
              </label>

              <div>
                <span className="block text-sm font-medium text-neutral-700">Avatar</span>
                <div className="mt-2 flex items-center gap-4">
                  {showAvatarImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-neutral-200"
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-600 to-neutral-900 text-xl font-bold text-white ring-2 ring-neutral-200"
                      aria-hidden
                    >
                      {initialsDisplay}
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={onPickAvatar}
                      disabled={saving}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving || !uploadAvailable}
                        data-testid="profile-upload-image"
                      >
                        {showAvatarImage ? "Replace Image" : "Upload Image"}
                      </button>
                      {showAvatarImage ? (
                        <button
                          type="button"
                          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={onRemoveAvatarClick}
                          disabled={saving}
                          data-testid="profile-remove-image"
                        >
                          Remove Image
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {uploadAvailable
                        ? "Applied when you click Save."
                        : "Uploads require BLOB_READ_WRITE_TOKEN in Vercel for this environment."}
                    </p>
                  </div>
                </div>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
                  onClick={onCancelClick}
                  disabled={saving || !dirty}
                  data-testid="profile-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
                  disabled={saving || !dirty}
                  data-testid="profile-save-button"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="border-t border-neutral-200 px-5 py-4">
          <div className="flex justify-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              onClick={handleLogoutAttempt}
              data-testid="profile-logout"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
