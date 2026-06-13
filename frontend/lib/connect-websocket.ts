/**
 * Builds the connect_service STOMP/WebSocket URL with a JWT query parameter.
 * Browser WebSocket handshakes often cannot set `Authorization: Bearer`, so
 * the backend reads `access_token` or `token` for paths under `/ws/**`
 * (see `JwtAuthenticationFilter` in connect_service).
 *
 * Prefer `NEXT_PUBLIC_CONNECT_SERVICE_URL` (same value as `CONNECT_SERVICE_URL` in
 * `next.config.js`) so web and Capacitor builds hit the correct host.
 */
export function buildConnectWebSocketUrl(
  accessToken: string,
  path: string = "/ws/chat"
): string {
  if (accessToken == null || accessToken === "") {
    throw new Error("buildConnectWebSocketUrl: accessToken is required");
  }
  const configured =
    typeof process !== "undefined" &&
    process.env &&
    (process.env.NEXT_PUBLIC_CONNECT_SERVICE_URL as string | undefined);
  if (!configured && process.env.NODE_ENV === "production") {
    // Don't crash the chat UI, but surface the misconfiguration loudly.
    console.error(
      "NEXT_PUBLIC_CONNECT_SERVICE_URL is not set; falling back to localhost will not work in production."
    );
  }
  const raw = configured || "http://localhost:8086";
  const u = new URL(raw);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  const p = path.startsWith("/") ? path : `/${path}`;
  u.pathname = p;
  u.search = "";
  u.searchParams.set("access_token", accessToken);
  return u.toString();
}
