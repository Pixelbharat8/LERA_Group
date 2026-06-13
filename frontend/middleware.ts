import { NextRequest, NextResponse } from "next/server";

/**
 * Decode a JWT payload WITHOUT verifying the signature and report whether it is
 * structurally valid and not expired. This is a defense-in-depth gate only —
 * the backend still cryptographically verifies the token on every API call.
 * Returns false for malformed tokens or ones whose `exp` is in the past.
 */
function isTokenStructurallyValid(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    // base64url → base64, then decode. atob is available in the Edge runtime.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp === "number") {
      // exp is in seconds since epoch; reject if already past (with no skew).
      return payload.exp * 1000 > Date.now();
    }
    // No exp claim — treat as invalid; tokens are expected to carry one.
    return false;
  } catch {
    return false;
  }
}

/**
 * Next.js Middleware — protects /dashboard routes.
 * Requires a "token" cookie that is a structurally valid, non-expired JWT;
 * otherwise the user is redirected to /auth/login.
 * Public routes (/auth/*, /, /about, /contact, /courses, /api/*) are always allowed.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Public routes — never block ──────────────────────────────────
  const publicPrefixes = [
    "/auth",
    "/api",
    "/_next",
    "/favicon",
    "/images",
    "/assets",
    "/icons",
    "/manifest",
    "/sw.js",
  ];
  // Exact public paths (no subroutes).
  const publicExactPaths = ["/"];
  // Public sections where both the index and nested pages must be accessible without login.
  const publicRoutePrefixes = [
    "/about",
    "/contact",
    "/courses",
    "/programs",
    "/centers",
    "/news",
    "/blog",
    "/faq",
    "/privacy",
    "/terms",
    "/careers",
    "/admissions",
    "/book-trial",
    "/placement",
  ];

  if (
    publicExactPaths.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    publicRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next();
  }

  // ── Protected routes — require a valid, non-expired token cookie ──
  const token = request.cookies.get("token")?.value;

  if (!token || !isTokenStructurallyValid(token)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear a stale/expired token so the loop doesn't bounce on the next request.
    if (token) response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Apply to everything except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)"],
};
