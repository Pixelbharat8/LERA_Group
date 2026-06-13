import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { resolveServerAccessToken } from "../../../../lib/server-auth-token";

/**
 * Returns a STOMP broker WebSocket URL with JWT query param.
 * Reads the HttpOnly session cookie server-side (or refreshes via identity)
 * so the browser client never needs JS access to the token.
 */
export async function GET() {
  const jar = await cookies();
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie");

  const { token, setCookieHeaders } = await resolveServerAccessToken(
    jar,
    cookieHeader
  );

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const connectBase =
    process.env.CONNECT_SERVICE_URL ||
    process.env.NEXT_PUBLIC_CONNECT_SERVICE_URL ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("CONNECT_SERVICE_URL is not configured");
        })()
      : "http://localhost:8086");

  const u = new URL(connectBase);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = "/ws/chat";
  u.search = "";
  u.searchParams.set("access_token", token);

  const response = NextResponse.json({ url: u.toString() });
  for (const c of setCookieHeaders) {
    response.headers.append("Set-Cookie", c);
  }
  return response;
}
