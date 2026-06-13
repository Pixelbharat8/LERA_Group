/**
 * Platform-aware auth-token store for the Capacitor mobile shell.
 *
 * Web keeps using the backend's HttpOnly `token` cookie (the most secure option
 * for a browser — JS, and therefore XSS, can't read it). But iOS WKWebView does
 * NOT reliably persist that cookie across app cold-starts, and cross-origin XHR
 * can drop it, so a cookie-only design logs mobile users out. On native we ALSO
 * stash the JWT in @capacitor/preferences and feed it to apiFetch as an
 * `Authorization: Bearer` header — the header-based path the mobile-shipability
 * rule mandates — without weakening web auth.
 *
 * The read path (getNativeAuthToken) is a synchronous, dependency-free memory
 * read: apiFetch stays fast and the web bundle pulls in no native code (the
 * @capacitor/preferences import only happens on the native write/hydrate paths).
 */

let inMemoryToken: string | null = null;
const KEY = "lera_auth_token";

/** Capacitor injects this global only in the native shell; undefined on web/SSR. */
function isNative(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
}

/** Synchronous Bearer token for apiFetch. Always null on web (cookies handle web). */
export function getNativeAuthToken(): string | null {
  return inMemoryToken;
}

/** Persist the JWT after login. No-op on web. */
export async function saveNativeAuthToken(token: string | undefined | null): Promise<void> {
  if (!token || !isNative()) return;
  inMemoryToken = token;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: KEY, value: token });
  } catch {
    /* preferences unavailable — the in-memory copy still covers this session */
  }
}

/** Load a persisted token into memory at app start (native cold-start). No-op on web. */
export async function hydrateNativeAuthToken(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: KEY });
    if (value) inMemoryToken = value;
  } catch {
    /* ignore */
  }
}

/** Clear on logout. Clears memory everywhere; clears storage on native. */
export async function clearNativeAuthToken(): Promise<void> {
  inMemoryToken = null;
  if (!isNative()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key: KEY });
  } catch {
    /* ignore */
  }
}
