import type { PutBlobResult } from "@vercel/blob";

/** DB prefix for avatars stored in a private Vercel Blob store (pathname only). */
export const PRIVATE_AVATAR_PREFIX = "vercel:";

/**
 * Blob store access mode. Must match how the store was created in Vercel (public vs private).
 * @see https://vercel.com/docs/storage/vercel-blob#private-and-public-storage
 */
export function getBlobStoreAccess(): "public" | "private" {
  const raw = process.env["BLOB_ACCESS"]?.trim().toLowerCase();
  if (raw === "private") return "private";
  return "public";
}

/**
 * Value to persist in `users.avatar_url` after a successful `put()`.
 */
export function formatStoredAvatarFromPut(
  access: "public" | "private",
  blob: PutBlobResult,
): string {
  if (access === "private") return `${PRIVATE_AVATAR_PREFIX}${blob.pathname}`;
  return blob.url;
}

/** True when the row must be served via `/api/avatar/view` (private blob). */
export function isPrivateStoredAvatar(
  stored: string | null | undefined,
): boolean {
  return Boolean(stored?.startsWith(PRIVATE_AVATAR_PREFIX));
}

/**
 * Query segment so `<img src>` changes when the underlying blob pathname changes (private
 * avatars otherwise always used `/api/avatar/view` and browsers kept showing the old bitmap).
 * The view route resolves the blob from the database; `p` is ignored server-side.
 */
function privateAvatarCacheBuster(stored: string): string | null {
  const pathname = stored.slice(PRIVATE_AVATAR_PREFIX.length);
  if (!isSafeAvatarBlobPathname(pathname)) return null;
  return `p=${encodeURIComponent(pathname)}`;
}

/**
 * `src` for `<img>`: public URLs pass through; private rows use the authenticated proxy route.
 */
export function avatarSrcForImg(
  viewer: "self" | { userId: string },
  stored: string | null,
): string | null {
  if (!stored) return null;
  if (!isPrivateStoredAvatar(stored)) return stored;
  const q = privateAvatarCacheBuster(stored);
  if (!q) return null;
  if (viewer === "self") return `/api/avatar/view?${q}`;
  return `/api/avatar/view?userId=${encodeURIComponent(viewer.userId)}&${q}`;
}

/** Maps DB `avatar_url` to NextAuth `user.image` (always the signed-in user). */
export function sessionImageFromStoredAvatar(
  stored: string | null | undefined,
): string | undefined {
  const src = avatarSrcForImg("self", stored ?? null);
  return src ?? undefined;
}

/**
 * Pathnames we upload for avatars; rejects traversal if DB is ever tampered with.
 */
export function isSafeAvatarBlobPathname(pathname: string): boolean {
  if (pathname.length > 400 || pathname.includes("..")) return false;
  return pathname.startsWith("avatars/");
}
