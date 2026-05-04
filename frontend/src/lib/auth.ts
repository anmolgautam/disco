// Tiny auth shim. Stores Basic-Auth credentials in localStorage and exposes
// helpers used by sseFetch and the AuthGate component.

const KEY = "compose:auth";

export function getAuthHeader(): string | null {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
  return raw ? `Basic ${raw}` : null;
}

export function setAuth(username: string, password: string): void {
  // btoa handles ASCII; Basic Auth payloads are conventionally ASCII-safe.
  const encoded = btoa(`${username}:${password}`);
  window.localStorage.setItem(KEY, encoded);
}

export function clearAuth(): void {
  window.localStorage.removeItem(KEY);
}

export function hasAuth(): boolean {
  return getAuthHeader() !== null;
}
