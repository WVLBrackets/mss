"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";

interface Row {
  id: string;
  email: string;
  name: string;
  role: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastLogin: string | null;
}

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

  async function deleteOne(id: string) {
    if (!confirm("Delete this user?")) return;
    const q = protectConfirmed ? "?protect_confirmed=1" : "";
    const res = await fetchWithCsrf(`/api/admin/users/${id}${q}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
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
          className="rounded border border-neutral-300 px-2 py-1 text-sm"
          placeholder="Search…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          data-testid="admin-users-search"
        />
        <button
          type="button"
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
          onClick={() => setSearch(searchInput)}
          data-testid="admin-users-search-apply"
        >
          Apply search
        </button>
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
              <th className="p-2 w-8" />
              <th className="p-2">User</th>
              <th className="p-2">Role</th>
              <th className="p-2">Created</th>
              <th className="p-2">Last login</th>
              <th className="p-2">Actions</th>
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
                    <div className="font-medium">{r.name}</div>
                    <div className="text-neutral-500">{r.email}</div>
                  </td>
                  <td className="p-2">{r.role}</td>
                  <td className="p-2 text-neutral-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-2 text-neutral-600">
                    {r.lastLogin ? new Date(r.lastLogin).toLocaleString() : "Never"}
                  </td>
                  <td className="p-2 space-x-1">
                    {!r.emailConfirmed ? (
                      <button
                        type="button"
                        className="text-blue-600 text-xs underline"
                        onClick={() => void confirmUser(r.id)}
                        data-testid={`admin-user-confirm-${r.id}`}
                      >
                        Confirm
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-blue-600 text-xs underline"
                      onClick={() => setEditing(r)}
                      data-testid={`admin-user-edit-${r.id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-blue-600 text-xs underline"
                      onClick={() => setPwdUser(r)}
                      data-testid={`admin-user-password-${r.id}`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      className="text-red-600 text-xs underline"
                      onClick={() => void deleteOne(r.id)}
                      data-testid={`admin-user-delete-${r.id}`}
                    >
                      Delete
                    </button>
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

function EditUserDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email);
  const [isAdmin, setIsAdmin] = useState(row.role === "Admin");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, isAdmin }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h3 className="font-semibold">Edit user</h3>
        <div className="mt-3 space-y-2">
          <label className="block text-sm">
            Name
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            Admin
          </label>
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
