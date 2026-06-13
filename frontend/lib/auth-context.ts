import Cookies from "js-cookie";

/** JWT auth user id from the client cookie (not academy student/teacher entity id). */
export function getAuthUserIdFromCookie(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const userData = Cookies.get("userData");
    if (!userData) return null;
    const parsed = JSON.parse(decodeURIComponent(userData));
    return String(parsed.id || parsed.userId || "") || null;
  } catch {
    return null;
  }
}
