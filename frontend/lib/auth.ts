import Cookies from "js-cookie";
import { apiUrl } from "./api";
import { clearNativeAuthToken } from "./native/token-store";

/**
 * End the user's session.
 *
 * Calls the backend so the HttpOnly cookies (`token`, `refreshToken`) that
 * JS cannot touch are properly cleared, then wipes the JS-readable hints
 * (`tokenSet`, role, userData) and finally redirects to the login page.
 *
 * Best-effort — even if the network call fails (e.g. the user is offline)
 * we still wipe local state so the UI immediately reflects logout.
 */
export async function logoutSession(redirectTo: string = "/auth/login") {
  try {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network failures — local cleanup below is what the UI cares about.
  }

  Cookies.remove("token");
  Cookies.remove("refreshToken");
  Cookies.remove("tokenSet");
  Cookies.remove("role");
  Cookies.remove("actualRole");
  Cookies.remove("userData");
  Cookies.remove("userPermissions");
  void clearNativeAuthToken(); // native shells: drop the persisted JWT

  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}
