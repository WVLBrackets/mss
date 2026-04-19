/**
 * Values substituted for `{Full Name}`, `{Display Name}`, and `{Initials}` in Config Sheet strings.
 * Token matching is case-insensitive and allows optional spaces inside the braces.
 */
export type UserPlaceholderValues = {
  fullName: string;
  displayName: string;
  initials: string;
};

/** Placeholders when no signed-in user is available (e.g. logged-out home, sign-in page). */
export const ANONYMOUS_USER_PLACEHOLDERS: UserPlaceholderValues = {
  fullName: "Guest",
  displayName: "Guest",
  initials: "?",
};

/**
 * Builds placeholder values from a JWT session user (`getAuthSession` or `useSession`).
 * Prefer DB-backed values in server components when a user row is available.
 */
export function placeholdersFromSessionUser(user: {
  fullName?: string | null;
  name?: string | null;
  initials?: string | null;
  email?: string | null;
}): UserPlaceholderValues {
  const displayName =
    user.name?.trim() || ANONYMOUS_USER_PLACEHOLDERS.displayName;
  return {
    fullName:
      user.fullName?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      ANONYMOUS_USER_PLACEHOLDERS.fullName,
    displayName,
    initials:
      user.initials?.trim().slice(0, 3) ||
      ANONYMOUS_USER_PLACEHOLDERS.initials,
  };
}

/**
 * Replaces user-oriented placeholders in copy from the Config Sheet.
 *
 * Supported tokens (case-insensitive, optional inner spaces):
 * - `{Full Name}` → full legal / signup name
 * - `{Display Name}` → display name shown in the app
 * - `{Initials}` → up to three initials characters
 *
 * Legacy `{name}` is treated as an alias for `{Display Name}` for older sheet rows.
 */
export function resolveUserPlaceholders(
  template: string,
  values: UserPlaceholderValues,
): string {
  const { fullName, displayName, initials } = values;
  return template
    .replace(/\{\s*full\s*name\s*\}/gi, fullName)
    .replace(/\{\s*display\s*name\s*\}/gi, displayName)
    .replace(/\{\s*initials\s*\}/gi, initials)
    .replace(/\{\s*name\s*\}/gi, displayName);
}
