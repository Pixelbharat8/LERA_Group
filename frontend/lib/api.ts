import Cookies from "js-cookie";

/**
 * Central API helper for the LERA frontend.
 *
 * Auth model — TWO modes, transparent to callers:
 *   1. **HttpOnly cookie mode (default after login)**:
 *      - Backend sets `token` and `refreshToken` as HttpOnly cookies during
 *        /api/auth/login. The browser sends them automatically on every
 *        same-site request when `credentials: "include"` is used.
 *      - JS cannot read these cookies (good — XSS-resistant), but it CAN
 *        observe a non-HttpOnly `tokenSet=1` flag we set on login so the
 *        UI knows the user is signed in.
 *   2. **Bearer header mode (legacy/non-browser)**:
 *      - If a JS-readable `token` cookie still exists (e.g. older session,
 *        mobile webview, postman), we attach it as `Authorization: Bearer`.
 *      - Same flow on 401: try /refresh once, then bounce to login.
 *
 * On 401:
 *   1. Call /api/auth/refresh once (cookie-based — no body needed if the
 *      refreshToken cookie is set; legacy refreshToken cookie is sent as
 *      JSON for backward compatibility).
 *   2. Retry the original request.
 *   3. If refresh fails, clear local hints + bounce to /auth/login.
 *
 * Set NEXT_PUBLIC_API_BASE_URL to override the base URL for cross-origin
 * deployments. When same-origin (most setups), leave it empty.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) path = "/" + path;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

/**
 * Refresh-in-flight de-duplication. If five tabs simultaneously hit a 401, we
 * only want to mint one new pair of tokens; everyone else awaits the same
 * promise.
 */
let inFlightRefresh: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (inFlightRefresh) return inFlightRefresh;

  // Refresh works in two ways:
  //   • Cookie mode  → empty body; backend reads HttpOnly refreshToken cookie.
  //   • Legacy mode → JSON body with refreshToken from JS-readable cookie.
  const legacyRefresh = Cookies.get("refreshToken");

  inFlightRefresh = (async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legacyRefresh ? { refreshToken: legacyRefresh } : {}),
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      if (!data?.success) return false;

      // The backend (re-)sets the HttpOnly token/refreshToken cookies on refresh, so we
      // deliberately do NOT mirror them into JS-readable cookies (XSS surface). Only the
      // non-sensitive "logged in" hint is kept so AuthGuard/hasAuthSession stay satisfied.
      Cookies.set("tokenSet", "1", { expires: 1 });
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        inFlightRefresh = null;
      }, 0);
    }
  })();

  return inFlightRefresh;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  // We can only clear JS-readable hints. The HttpOnly cookies will be cleared
  // by the next /api/auth/logout call (the dashboard layout already calls it).
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  Cookies.remove("tokenSet");
  Cookies.remove("user");
  Cookies.remove("userData");
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/auth/")) {
    window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

async function doFetch(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  // Legacy bearer support: if a JS-readable token cookie is still around,
  // include it as a fallback for callers hitting services whose filter has
  // not yet been redeployed with cookie support.
  const legacyToken = Cookies.get("token");
  if (legacyToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${legacyToken}`);
  }
  const url = apiUrl(path);

  const res = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  return res;
}

/**
 * Returns `true` if the user appears to be authenticated. Checks both the
 * legacy `token` cookie (bearer mode) and the `tokenSet` hint that the
 * cookie-mode login flow drops as a JS-readable flag.
 */
export function hasAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(Cookies.get("token") || Cookies.get("tokenSet"));
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  let res = await doFetch(path, init);

  // Try to refresh on 401, once, but only if we have any indication of an
  // existing session — otherwise we're just hitting a protected endpoint
  // anonymously and there's nothing to refresh.
  if (res.status === 401 && hasAuthSession()) {
    const ok = await tryRefreshToken();
    if (ok) {
      res = await doFetch(path, init);
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expired. Redirecting to login...");
    }
    const msg = (data && (data.message || data.error)) || res.statusText;
    const finalMsg = typeof msg === "string" ? msg : "Request failed";
    // Surface non-401 errors to the global toast container. Callers can still
    // catch the throw for their own UX; this just guarantees something is shown.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lera:error", { detail: { message: finalMsg } }));
    }
    throw new Error(finalMsg);
  }

  return data;
}
