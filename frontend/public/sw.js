/* LERA Service Worker.
 *
 * Two responsibilities:
 *   1. Show notifications when the browser receives a Web Push payload.
 *   2. Hand control back to an existing tab (or open one) when the user
 *      clicks the notification.
 *
 * Intentionally minimal — no offline caching here. Adding offline support
 * via Workbox or similar is a separate, well-scoped follow-up. Keeping the
 * SW small means upgrades (and the 24-hour `update_check` window) don't
 * accidentally serve stale assets.
 */

/* eslint-env serviceworker */

self.addEventListener("install", () => {
  // Become the active SW immediately on first install — avoids a confusing
  // "no notifications" window on the first load.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "LERA", body: event.data ? event.data.text() : "" };
  }
  let title = payload.title || payload.notification?.title || "";
  let body = payload.body || payload.notification?.body || "";
  let url = payload.url || payload.link || payload.notification?.click_action;
  if (
    !url &&
    payload.lera_type === "incoming_call" &&
    payload.lera_conversation_id &&
    payload.lera_call_id
  ) {
    const q = new URLSearchParams({
      incomingCall: "1",
      callId: String(payload.lera_call_id),
      conversationId: String(payload.lera_conversation_id),
      callKind: String(payload.lera_call_kind || "VOICE"),
      callerId: String(payload.lera_caller_id || ""),
    });
    url = `/dashboard/connect?${q.toString()}`;
    if (!title) title = "Incoming call";
    if (!body) body = "Tap to answer on LERA Connect";
  }
  if (
    !url &&
    payload.lera_type === "call_ended" &&
    payload.lera_call_id
  ) {
    const q = new URLSearchParams({
      callEnded: "1",
      callId: String(payload.lera_call_id),
    });
    if (payload.lera_reason) q.set("reason", String(payload.lera_reason));
    if (payload.lera_conversation_id) {
      q.set("conversationId", String(payload.lera_conversation_id));
    }
    url = `/dashboard/connect?${q.toString()}`;
    if (!title) title = "LERA Connect";
    if (!body) {
      body =
        payload.lera_reason === "declined" ? "Call declined" : "Call ended";
    }
  }
  if (!url) url = "/dashboard";
  if (!title) title = "LERA";
  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { ...payload, url },
    tag: payload.tag || (payload.lera_call_id ? `call-${payload.lera_call_id}` : undefined),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      for (const client of all) {
        if ("focus" in client) {
          client.navigate?.(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
