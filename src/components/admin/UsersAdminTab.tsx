"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, KeyRound, Pencil, Trash2 } from "lucide-react";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";
import { avatarSrcForImg } from "@/lib/blobAvatar";

interface Row {
  id: string;
  email: string;
  name: string;
  display_name: string;
  initials: string;
  avatarUrl: string | null;
  role: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const SEARCH_DEBOUNCE_MS = 350;

export function UsersAdminTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [unconfirmedOnly, setUnconfirmedOnly] = useState(false);
  const [protectConfirmed, setProtectConfirmed] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Row | null>(null);
  const [pwdUser, setPwdUser] = useState<Row | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (unconfirmedOnly) q.set("unconfirmed", "1");
      if (search.trim()) q.set("search", search.trim());
      const res = await fetch(`/api/admin/users?${q}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        return;
      }
      setRows(json.data as Row[]);
      setSelected(new Set());
      setPendingDeleteId(null);
    } finally {
      setLoading(false);
    }
  }, [search, unconfirmedOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => rows, [rows]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} user(s)?`)) return;
    const res = await fetchWithCsrf("/api/admin/users/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: Array.from(selected),
        protectConfirmed,
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error ?? "Bulk delete failed");
      return;
    }
    await load();
  }

  async function confirmUser(id: string) {
    const res = await fetchWithCsrf(`/api/admin/users/${id}/confirm`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error ?? "Confirm failed");
      return;
    }
    await load();
  }

  async function executeDeleteUser(id: string) {
    const q = protectConfirmed ? "?protect_confirmed=1" : "";
    const res = await fetchWithCsrf(`/api/admin/users/${id}${q}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error ?? "Delete failed");
      return;
    }
    setPendingDeleteId(null);
    await load();
  }

  function clearPendingDelete() {
    setPendingDeleteId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
          onClick={() => void load()}
          data-testid="admin-users-refresh"
        >
          Refresh
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unconfirmedOnly}
            onChange={(e) => setUnconfirmedOnly(e.target.checked)}
            data-testid="admin-users-unconfirmed-filter"
          />
          Unconfirmed only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={protectConfirmed}
            onChange={(e) => setProtectConfirmed(e.target.checked)}
            data-testid="admin-users-protect-confirmed"
          />
          Protect confirmed
        </label>
        <input
          className="min-w-[12rem] rounded border border-neutral-300 px-2 py-1 text-sm"
          placeholder="Search…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          data-testid="admin-users-search"
        />
        <button
          type="button"
          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          disabled={!selected.size}
          onClick={() => void bulkDelete()}
          data-testid="admin-users-bulk-delete"
        >
          Bulk delete
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-neutral-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="w-8 p-2" />
              <th className="p-2">User</th>
              <th className="p-2">Role</th>
              <th className="p-2">Created</th>
              <th className="p-2">Last login</th>
              <th className="w-[1%] whitespace-nowrap p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-neutral-500">
                  Loading…
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      data-testid={`admin-user-select-${r.id}`}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <UserAvatarThumb row={r} />
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-neutral-500">
                          Display: {r.display_name} · {r.initials}
                        </div>
                        <div className="text-neutral-500">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">{r.role}</td>
                  <td className="p-2 text-neutral-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-2 text-neutral-600">
                    {r.lastLogin ? new Date(r.lastLogin).toLocaleString() : "Never"}
                  </td>
                  <td className="p-2 align-top">
                    {pendingDeleteId === r.id ? (
                      <div
                        className="inline-grid w-[5.5rem] gap-1.5 rounded border border-red-200 bg-red-50 p-2 text-center"
                        data-testid={`admin-user-delete-confirm-${r.id}`}
                      >
                        <span className="col-span-2 text-[11px] leading-tight text-red-900">
                          Delete this user?
                        </span>
                        <button
                          type="button"
                          className="rounded border border-neutral-300 bg-white px-1 py-1 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50"
                          onClick={clearPendingDelete}
                          data-testid={`admin-user-delete-cancel-${r.id}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded border border-red-600 bg-red-600 px-1 py-1 text-[11px] font-medium text-white hover:bg-red-700"
                          onClick={() => void executeDeleteUser(r.id)}
                          data-testid={`admin-user-delete-confirm-yes-${r.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="inline-grid grid-cols-2 gap-1.5">
                        <AdminActionIconButton
                          variant="edit"
                          label="Edit"
                          onClick={() => {
                            clearPendingDelete();
                            setEditing(r);
                          }}
                          data-testid={`admin-user-edit-${r.id}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </AdminActionIconButton>
                        <AdminActionIconButton
                          variant="password"
                          label="Change Password"
                          onClick={() => {
                            clearPendingDelete();
                            setPwdUser(r);
                          }}
                          data-testid={`admin-user-password-${r.id}`}
                        >
                          <KeyRound className="h-4 w-4" aria-hidden />
                        </AdminActionIconButton>
                        <AdminActionIconButton
                          variant="confirm"
                          label={r.emailConfirmed ? "Already confirmed" : "Confirm email"}
                          disabled={r.emailConfirmed}
                          onClick={() => {
                            clearPendingDelete();
                            void confirmUser(r.id);
                          }}
                          data-testid={`admin-user-confirm-${r.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                        </AdminActionIconButton>
                        <AdminActionIconButton
                          variant="delete"
                          label="Delete"
                          onClick={() => setPendingDeleteId(r.id)}
                          data-testid={`admin-user-delete-${r.id}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </AdminActionIconButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <EditUserDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
      {pwdUser ? (
        <PasswordDialog
          row={pwdUser}
          onClose={() => setPwdUser(null)}
          onSaved={() => {
            setPwdUser(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

type AdminActionVariant = "edit" | "password" | "confirm" | "delete";

type AdminActionIconButtonProps = {
  label: string;
  onClick: () => void;
  variant: AdminActionVariant;
  disabled?: boolean;
  children: React.ReactNode;
  "data-testid"?: string;
};

const ACTION_VARIANT_CLASS: Record<AdminActionVariant, string> = {
  edit: "border-blue-700 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  password:
    "border-amber-500 bg-amber-400 text-amber-950 hover:bg-amber-500 focus:ring-amber-400",
  confirm:
    "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
  delete: "border-red-700 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const ACTION_CONFIRM_DISABLED =
  "cursor-not-allowed border-emerald-300 bg-emerald-200/90 text-emerald-900 opacity-70 hover:bg-emerald-200/90";

/**
 * Small square icon button for admin row actions; `label` is `title` + `aria-label`.
 */
function AdminActionIconButton({
  label,
  onClick,
  variant,
  disabled = false,
  children,
  "data-testid": dataTestId,
}: AdminActionIconButtonProps) {
  const base =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none";
  const color =
    disabled && variant === "confirm"
      ? ACTION_CONFIRM_DISABLED
      : ACTION_VARIANT_CLASS[variant];
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      data-testid={dataTestId}
      className={`${base} ${color}`}
    >
      {children}
    </button>
  );
}

function UserAvatarThumb({ row }: { row: Row }) {
  const initials = row.initials?.slice(0, 3).toUpperCase() || "?";
  const thumbSrc = avatarSrcForImg({ userId: row.id }, row.avatarUrl);
  if (thumbSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbSrc}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-neutral-200"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-xs font-semibold text-white ring-1 ring-neutral-200">
      {initials}
    </div>
  );
}

function EditUserDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(row.name);
  const [displayName, setDisplayName] = useState(row.display_name);
  const [initials, setInitials] = useState(row.initials);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(row.avatarUrl);
  const [isAdmin, setIsAdmin] = useState(row.role === "Admin");
  const [busy, setBusy] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetchWithCsrf(`/api/admin/users/${row.id}/avatar`, {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error ?? "Avatar upload failed");
      return;
    }
    const url = j?.data?.url as string | undefined;
    if (url) setAvatarUrl(url);
  }

  async function save() {
    setBusy(true);
    try {
      if (pendingFile) {
        await uploadAvatar(pendingFile);
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
        setPendingFile(null);
      }
      const res = await fetchWithCsrf(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          display_name: displayName.trim(),
          initials: initials.trim().toUpperCase().slice(0, 3),
          avatar_url: avatarUrl,
          isAdmin,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Save failed");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(URL.createObjectURL(file));
    setPendingFile(file);
  }

  async function clearAvatar() {
    if (!confirm("Remove avatar image for this user?")) return;
    setAvatarUrl(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    setPendingFile(null);
    const res = await fetchWithCsrf(`/api/admin/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: null }),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error ?? "Could not clear avatar");
      return;
    }
    onSaved();
  }

  const showImg = Boolean(pendingPreview || avatarUrl);
  const imgSrc =
    pendingPreview ??
    avatarSrcForImg({ userId: row.id }, avatarUrl) ??
    "";
  const initialsDisplay = initials.trim().toUpperCase().slice(0, 3) || "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow">
        <h3 className="font-semibold">Edit user</h3>
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            Full name
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Display name
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Initials (1–3)
            <input
              className="mt-1 w-full rounded border px-2 py-1 uppercase"
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
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full cursor-not-allowed rounded border bg-neutral-100 px-2 py-1 text-neutral-600"
              readOnly
              value={row.email}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            Admin
          </label>

          <div>
            <span className="text-sm font-medium">Avatar</span>
            <div className="mt-2 flex items-center gap-3">
              {showImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover ring-1 ring-neutral-200"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-sm font-semibold text-white ring-1 ring-neutral-200">
                  {initialsDisplay}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload image
                </button>
                {avatarUrl ? (
                  <button type="button" className="text-xs text-red-600 underline" onClick={() => void clearAvatar()}>
                    Remove image
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Requires BLOB_READ_WRITE_TOKEN on the server. Click Save after choosing a file.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-neutral-900 px-3 py-1 text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void save()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/users/${row.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h3 className="font-semibold">Set password — {row.email}</h3>
        <input
          type="password"
          className="mt-3 w-full rounded border px-2 py-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-neutral-900 px-3 py-1 text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void save()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
