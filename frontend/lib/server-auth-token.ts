import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

function identityServiceUrl(): string {
  const configured =
    process.env.IDENTITY_SERVICE_URL || process.env.NEXT_PUBLIC_IDENTITY_SERVICE_URL;
  if (configured) return configured;
  // In production the localhost fallback is always wrong — fail loudly instead
  // of silently pointing service-to-service auth at the local machine.
  if (process.env.NODE_ENV === "production") {
    throw new Error("IDENTITY_SERVICE_URL is not configured");
  }
  return "http://localhost:8081";
}

/**
 * Resolves a JWT for server routes (e.g. STOMP ws-url).
 * Uses the HttpOnly `token` cookie when present; otherwise rotates via
 * `/api/auth/refresh` using forwarded browser cookies.
 */
export async function resolveServerAccessToken(
  jar: ReadonlyRequestCookies,
  cookieHeader: string | null
): Promise<{ token: string | null; setCookieHeaders: string[] }> {
  const direct = jar.get("token")?.value;
  if (direct) {
    return { token: direct, setCookieHeaders: [] };
  }

  const hasRefresh =
    Boolean(jar.get("refreshToken")?.value) ||
    Boolean(cookieHeader?.includes("refreshToken="));
  const hasSessionHint = Boolean(jar.get("tokenSet")?.value);
  if (!hasRefresh && !hasSessionHint) {
    return { token: null, setCookieHeaders: [] };
  }

  try {
    const res = await fetch(`${identityServiceUrl()}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    const setCookieHeaders =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [];

    if (!res.ok) {
      return { token: null, setCookieHeaders };
    }

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      token?: string;
    } | null;

    if (data?.success && data.token) {
      return { token: data.token, setCookieHeaders };
    }

    const fromCookie = setCookieHeaders
      .map((c) => c.split(";")[0])
      .find((c) => c.startsWith("token="))
      ?.slice("token=".length);
    if (fromCookie) {
      return { token: decodeURIComponent(fromCookie), setCookieHeaders };
    }

    return { token: null, setCookieHeaders };
  } catch {
    return { token: null, setCookieHeaders: [] };
  }
}
