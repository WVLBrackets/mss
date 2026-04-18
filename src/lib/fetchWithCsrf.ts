/**
 * Performs a mutating fetch with CSRF double-submit cookie + header.
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const csrfRes = await fetch(
    typeof window !== "undefined"
      ? `${window.location.origin}/api/csrf-token`
      : "/api/csrf-token",
    { credentials: "include" },
  );
  const json = await csrfRes.json();
  const token = json?.data?.token as string | undefined;
  if (!token) {
    throw new Error("Could not obtain CSRF token");
  }
  const headers = new Headers(init.headers);
  headers.set("x-csrf-token", token);
  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}
