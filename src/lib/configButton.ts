/**
 * Parses a Config Sheet button cell: `Label|/relative/path`.
 * Returns `hidden` when the cell is `X` (case-insensitive) or empty.
 */
export function parseConfigButton(raw: string): "hidden" | { label: string; path: string } {
  const t = raw.trim();
  if (!t || t.toUpperCase() === "X") return "hidden";
  const pipe = t.indexOf("|");
  if (pipe < 0) return "hidden";
  const label = t.slice(0, pipe).trim();
  const path = t.slice(pipe + 1).trim();
  if (!label || !path) return "hidden";
  return { label, path };
}
