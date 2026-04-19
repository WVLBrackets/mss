/**
 * Default display name: text before the first space, or the full trimmed string if none.
 */
export function defaultDisplayName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "";
  const sp = t.indexOf(" ");
  return sp === -1 ? t : t.slice(0, sp).trim() || t;
}

/**
 * Default initials: first character of display name, uppercased (user may expand to 3 in profile).
 */
export function defaultInitialsFromDisplay(displayName: string): string {
  const d = displayName.trim();
  if (!d) return "?";
  return d.slice(0, 1).toUpperCase();
}
