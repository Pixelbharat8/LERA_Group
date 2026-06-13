/**
 * Browser Push registration. Standard Push API + Service Worker.
 *
 * In a regular browser this:
 *   1. Registers `/sw.js` once (idempotent).
 *   2. Asks for Notifications permission only when the user hasn't decided.
 *   3. Subscribes the browser to push using the configured VAPID public key.
 *   4. POSTs the full PushSubscription JSON to /api/device-tokens (platform=WEB).
 *      connect_service routes that to the Web Push Protocol (VAPID) via
 *      nl.martijndwars:web-push — not FCM. If you use the Firebase web SDK
 *      getToken() instead, POST the raw FCM string; the backend will send
 *      that path through FCM HTTP v1.
 *
 * Inside Capacitor we let `native-push.ts` handle registration via the OS
 * APIs (APNs / FCM directly), so this module bails out early.
 *
 * Permission UX: we only ever PROMPT once per session and only when the
 * user is in a context that already implies they'd want notifications
 * (e.g. they just logged in, viewed the bell). Calling this at app boot
 * without a user gesture would burn the permission for the whole site.
 */
import { apiFetch } from "./api";

let registered = false;

const VAPID_PUBLIC_KEY: string | undefined =
  // Next.js exposes NEXT_PUBLIC_* to the client bundle; if missing the
  // helper still installs the SW but skips push subscription.
  (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) ||
  undefined;

export async function registerWebPushIfPossible(opts: { promptIfDefault?: boolean } = {}): Promise<void> {
  if (typeof window === "undefined" || registered) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  // Inside Capacitor, the native module owns push — don't double-register.
  try {
    const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
    if (cap?.getPlatform && cap.getPlatform() !== "web") return;
  } catch {
    // not in Capacitor — proceed
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    if (Notification.permission === "denied") return;
    if (Notification.permission === "default") {
      if (!opts.promptIfDefault) return;
      const granted = await Notification.requestPermission();
      if (granted !== "granted") return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.debug("[web-push] no VAPID public key configured; SW registered but no subscription");
      registered = true;
      return;
    }

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    // We send the JSON of the subscription as the token; connect_service
    // stores opaque platform tokens, so any web-compatible string works
    // and the same row can be passed back to the push provider later.
    await apiFetch("/api/device-tokens", {
      method: "POST",
      body: JSON.stringify({
        token: JSON.stringify(sub.toJSON()),
        platform: "WEB",
        deviceName:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : undefined,
      }),
    });
    registered = true;
    console.info("[web-push] registered web push subscription");
  } catch (e) {
    console.debug("[web-push] skipped:", (e as Error).message);
  }
}

/** VAPID public keys are URL-safe base64; PushManager.subscribe wants a Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
