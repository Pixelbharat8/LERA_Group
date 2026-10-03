import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The STOMP endpoint lives at /ws/chat on connect_service, and nginx routes /api/* explicitly
 * with a catch-all `location /` to the frontend. /ws was never listed, so the handshake landed
 * on Next.js. It failed quietly in both directions: `useConnectStomp` bails on a non-ok
 * response without surfacing anything, and both chat screens poll as a fallback (4s while
 * disconnected rather than 15s) — so messaging looked fine while the socket never opened.
 * WebRTC call signalling has no polling fallback and simply did not work.
 */
const REPO = path.resolve(__dirname, "..", "..");
const nginx = fs.readFileSync(path.join(REPO, "gateway", "nginx", "nginx.conf"), "utf8");

/** The `location ... { ... }` block whose prefix matches `prefix`, or null. */
function locationBlock(prefix: string): string | null {
  const re = new RegExp(`location\\s+\\^~\\s+${prefix.replace(/\//g, "\\/")}\\s*\\{`);
  const m = nginx.match(re);
  if (!m || m.index === undefined) return null;
  let depth = 0;
  for (let i = nginx.indexOf("{", m.index); i < nginx.length; i++) {
    if (nginx[i] === "{") depth++;
    else if (nginx[i] === "}") {
      depth--;
      if (depth === 0) return nginx.slice(m.index, i + 1);
    }
  }
  return null;
}

describe("the websocket handshake is routed to connect_service", () => {
  it("has a /ws/ location block", () => {
    expect(locationBlock("/ws/")).not.toBeNull();
  });

  it("proxies it to connect_service, not the frontend", () => {
    const block = locationBlock("/ws/")!;
    expect(block).toMatch(/proxy_pass\s+http:\/\/connect_service\s*;/);
  });

  it("sends the upgrade headers, without which the handshake is a plain 400", () => {
    const block = locationBlock("/ws/")!;
    expect(block).toMatch(/proxy_http_version\s+1\.1\s*;/);
    expect(block).toMatch(/proxy_set_header\s+Upgrade\s+\$http_upgrade\s*;/);
    expect(block).toMatch(/proxy_set_header\s+Connection\s+"upgrade"\s*;/);
  });

  it("forwards the proto so ws-url can tell the client wss rather than ws", () => {
    // ChatController.wsUrl reads X-Forwarded-Proto; an https page refuses an insecure socket.
    expect(locationBlock("/ws/")!).toMatch(/X-Forwarded-Proto/);
  });

  it("declares the STOMP path the backend actually registers", () => {
    const cfg = fs.readFileSync(
      path.join(REPO, "backend/connect_service/src/main/java/com/lera/connect_service/config/WebSocketConfig.java"),
      "utf8",
    );
    const endpoints = Array.from(cfg.matchAll(/addEndpoint\("([^"]+)"\)/g)).map((m) => m[1]);
    expect(endpoints.length).toBeGreaterThan(0);
    for (const e of endpoints) {
      expect(e.startsWith("/ws/")).toBe(true); // else the /ws/ route above does not cover it
    }
  });

  it("takes its allowed origins from configuration, shared with HTTP CORS", () => {
    // Hard-coding them here meant CORS_ALLOWED_ORIGINS fixed REST on a custom domain and left
    // the socket origin-blocked — the failure that hides behind the polling fallback.
    const cfg = fs.readFileSync(
      path.join(REPO, "backend/connect_service/src/main/java/com/lera/connect_service/config/WebSocketConfig.java"),
      "utf8",
    );
    expect(cfg).toMatch(/\$\{lera\.cors\.allowed-origins:/);
    expect(cfg).not.toMatch(/String\[\]\s+origins\s*=\s*\{/); // the old hard-coded array
  });
});
