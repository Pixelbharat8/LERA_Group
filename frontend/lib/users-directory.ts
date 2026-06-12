import Cookies from "js-cookie";
import { apiFetch } from "./api";
import { buildCenterFilterUrl } from "../app/hooks/useUserCenter";

const ORG_WIDE_ROLES = new Set(["SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR"]);
const DIRECTORY_SEARCH_ROLES = new Set([
  "CENTER_MANAGER",
  "CENTER_ADMIN",
  "ACADEMIC_MANAGER",
  "TEACHER",
  "STAFF",
  "TEACHING_ASSISTANT",
  "TA",
  "SUPER_ADMIN",
  "SUPERADMIN",
  "CHAIRMAN",
  "CEO",
  "DIRECTOR",
]);

function parseUserCookie(): { role: string; centerId: string | null } {
  try {
    const raw = Cookies.get("userData");
    if (!raw) return { role: "", centerId: null };
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      role: (parsed.roleName || parsed.role || "").toUpperCase(),
      centerId: parsed.centerId || null,
    };
  } catch {
    return { role: "", centerId: null };
  }
}

/** Center-scoped user list for chat name resolution (avoids unscoped GET /api/users). */
export async function loadChatUserDirectory(): Promise<
  { id: string; email?: string; fullname?: string; name?: string; roleName?: string }[]
> {
  const { role, centerId } = parseUserCookie();
  if (DIRECTORY_SEARCH_ROLES.has(role)) {
    const data = await apiFetch(
      `/api/users/search?q=${encodeURIComponent("%")}`
    ).catch(() => []);
    return Array.isArray(data) ? (data as { id: string; email?: string; fullname?: string; name?: string; roleName?: string }[]) : [];
  }
  if (centerId) {
    const url = buildCenterFilterUrl("/api/users", centerId);
    const data = await apiFetch(url).catch(() => []);
    return Array.isArray(data) ? (data as { id: string; email?: string; fullname?: string; name?: string; roleName?: string }[]) : [];
  }
  return [];
}
