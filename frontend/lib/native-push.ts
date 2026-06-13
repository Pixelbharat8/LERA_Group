/**
 * Native push registration for the Capacitor mobile shell.
 *
 * In a regular browser this module is a no-op — `Capacitor` either isn't
 * defined or `getPlatform()` returns "web", so we never even ask for the
 * permission. Inside the iOS/Android wrapper, we:
 *
 *   1. Ask the OS for push permission (skips silently if already granted).
 *   2. Call `register()` to receive a device token from APNs / FCM.
 *   3. POST the token to /api/device-tokens so connect_service can dispatch
 *      future notifications to this device.
 *
 * Imports are dynamic so that a normal `next dev` / `next build` doesn't
 * pull native code into the web bundle.
 */

import { apiFetch } from "./api";
import { openIncomingCallFromNativePush } from "./incoming-call-push";

let registered = false;

export async function registerNativePushIfPossible(): Promise<void> {
  if (typeof window === "undefined" || registered) return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    const platform = Capacitor.getPlatform();
    if (platform !== "ios" && platform !== "android") return;

    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      console.warn("[native-push] permission denied:", perm.receive);
      return;
    }

    PushNotifications.addListener("registration", async (t: { value: string }) => {
      try {
        // userId is intentionally NOT sent — the backend derives the owning
        // user from the JWT so a malicious client can't claim another user's
        // pushes. We still ship platform + a short device-name hint.
        await apiFetch("/api/device-tokens", {
          method: "POST",
          body: JSON.stringify({
            token: t.value,
            platform: platform.toUpperCase(),
            deviceName:
              typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : undefined,
          }),
        });
        console.info("[native-push] registered device token");
      } catch (e) {
        console.warn("[native-push] failed to register token", e);
      }
    });

    PushNotifications.addListener("registrationError", (err: unknown) => {
      console.error("[native-push] registration error", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (notif: unknown) => {
      // Forward to the in-app notification bus so the bell icon updates
      // without a re-fetch. Keeping it generic so we don't depend on the
      // exact notification shape returned by APNs/FCM.
      window.dispatchEvent(new CustomEvent("lera:push", { detail: notif }));
      openIncomingCallFromNativePush(notif);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action: unknown) => {
      openIncomingCallFromNativePush(action);
    });

    await PushNotifications.register();
    registered = true;
  } catch (e) {
    // Capacitor packages will be missing in pure-web installs — that's fine.
    console.debug("[native-push] skipped:", (e as Error).message);
  }
}
