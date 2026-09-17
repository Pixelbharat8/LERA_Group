import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Every backend endpoint has to be routed by the gateway as well as served by its service.
 * nginx lists each path explicitly, so a newly added controller is a 404 through the front door
 * even though the service answers it perfectly — which is exactly what happened to /api/badges:
 * the service returned 401 (registered and secured), the gateway returned 404, and nothing in
 * the build or the tests noticed.
 *
 * Two families are deliberately NOT routed and must stay that way:
 *   /api/internal/**     service-to-service calls, authenticated by the internal key. Exposing
 *                        these through the public gateway would be a security regression.
 *   /api/_deprecated/**  kept for reference, intentionally unreachable.
 */

const REPO = path.resolve(__dirname, "..", "..");
const NGINX = path.join(REPO, "gateway", "nginx", "nginx.conf");
const BACKEND = path.join(REPO, "backend");

const DELIBERATELY_UNROUTED = [/^\/api\/internal\//, /^\/api\/_deprecated\//];

function gatewayRoutes(): string[] {
  const conf = fs.readFileSync(NGINX, "utf8");
  const routes = Array.from(conf.matchAll(/location\s+\^~\s+(\/api\/[A-Za-z0-9_-]+)/g)).map((m) => m[1]);
  if (routes.length === 0) throw new Error("no ^~ /api routes parsed from nginx.conf");
  return routes;
}

/** Every controller's @RequestMapping base path, with the service it lives in. */
function controllerBasePaths(): Map<string, string> {
  const found = new Map<string, string>();
  const walk = (dir: string, service: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "target" || e.name === "test") continue;
        walk(full, service);
        continue;
      }
      if (!e.name.endsWith(".java") || !full.includes(`${path.sep}controller${path.sep}`)) continue;
      const m = fs.readFileSync(full, "utf8").match(/@RequestMapping\("(\/api\/[^"]+)"\)/);
      if (m) found.set(m[1].replace(/\/$/, ""), service);
    }
  };
  for (const service of fs.readdirSync(BACKEND)) {
    const src = path.join(BACKEND, service, "src", "main", "java");
    if (fs.existsSync(src)) walk(src, service);
  }
  if (found.size === 0) throw new Error("no controller base paths parsed");
  return found;
}

describe("gateway routes every endpoint the services expose", () => {
  it("no controller is a 404 through the gateway", () => {
    const routes = gatewayRoutes();
    const unrouted: string[] = [];

    for (const [base, service] of controllerBasePaths()) {
      if (DELIBERATELY_UNROUTED.some((rx) => rx.test(base))) continue;
      // nginx ^~ is a prefix match, so /api/books also serves /api/books/{id}
      const isRouted = routes.some((r) => base === r || base.startsWith(r));
      if (!isRouted) unrouted.push(`${base}  (${service})`);
    }

    expect(
      unrouted,
      unrouted.length
        ? `These are served by their service but have no gateway route, so they return 404 to ` +
          `any browser:\n  ${unrouted.join("\n  ")}\nAdd a location block in gateway/nginx/nginx.conf.`
        : ""
    ).toEqual([]);
  });

  it("internal-only endpoints are never exposed through the gateway", () => {
    const routes = gatewayRoutes();
    const leaked = routes.filter((r) => /^\/api\/(internal|_deprecated)\b/.test(r));
    expect(
      leaked,
      `${leaked.join(", ")} must not be routed publicly — /api/internal/** is authenticated by ` +
        `the shared internal key, not by a user's token.`
    ).toEqual([]);
  });
});
