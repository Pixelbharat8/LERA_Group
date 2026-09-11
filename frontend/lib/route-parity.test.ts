import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The app has TWO independent routing tables and development only exercises one of them:
 *
 *   frontend/next.config.js   rewrites — used by `next dev` and `next start`
 *   gateway/nginx/nginx.conf  locations — used by EVERY deployed stack (VPS and ECS)
 *
 * On 2026-09-11 that cost the platform its entire conversion funnel: nginx sent all of
 * /api/public to academy_service, but /api/public/leads lives in connect_service and
 * /api/public/payment in payment_service, so both returned 401. All four lead forms, online
 * enrolment and the VNPay flow were dead in any deployed configuration — while working
 * perfectly under `next dev`. Three more endpoints (device-tokens, event-rsvps,
 * marketing-config, permission-slips) 404'd the same way.
 *
 * This test fails if a backend controller that next.config.js routes is unreachable, or
 * reachable at the wrong service, through nginx. It only considers paths that have a REAL
 * @RequestMapping — dead rewrites pointing at controllers that were never built are ignored,
 * because they break nothing.
 */

const REPO = path.resolve(__dirname, "..", "..");
const NGINX = path.join(REPO, "gateway", "nginx", "nginx.conf");
const NEXT = path.join(REPO, "frontend", "next.config.js");
const BACKEND = path.join(REPO, "backend");

/** nginx upstream name -> short service key. */
const UPSTREAM: Record<string, string> = {
  academy_service: "academy", connect_service: "connect", payment_service: "payment",
  payroll_service: "payroll", attendance_service: "attendance", identity_service: "identity",
  ai_gateway: "ai", rule_engine: "rule", social_media_service: "social", frontend: "frontend",
};

/** next.config.js template variable -> short service key. */
const NEXT_VAR: Record<string, string> = {
  academyUrl: "academy", connectUrl: "connect", paymentUrl: "payment", payrollUrl: "payroll",
  attendanceUrl: "attendance", identityUrl: "identity", aiGatewayUrl: "ai",
  ruleEngineUrl: "rule", socialMediaUrl: "social",
};

/** backend directory -> short service key. */
const svcKey = (dir: string) =>
  dir.replace("_service", "").replace("ai_gateway", "ai").replace("rule_engine", "rule");

/**
 * Intentional divergences. Each needs a reason — this list is where a deliberate decision is
 * recorded, so the test can stay strict everywhere else.
 */
const ALLOWED_DIVERGENCE: Record<string, string> = {
  "/api/lead-followups":
    "CRM is deliberately consolidated on connect_service; the social_media_service duplicate " +
    "is shadowed on purpose (see the comment in nginx.conf). No frontend code calls this path.",
};

function nginxRules(): Array<[string, string]> {
  const src = fs.readFileSync(NGINX, "utf8");
  const out: Array<[string, string]> = [];
  const re = /location\s+\^~\s+(\/api\/[\w/-]+)\s*\{[^}]*?proxy_pass\s+http:\/\/(\w+)/g;
  for (const m of src.matchAll(re)) out.push([m[1].replace(/\/$/, ""), UPSTREAM[m[2]] ?? m[2]]);
  return out;
}

function nextRoutes(): Map<string, string> {
  const src = fs.readFileSync(NEXT, "utf8");
  const out = new Map<string, string>();
  const re = /source:\s*"(\/api\/[\w/:*-]+)"[^}]*?destination:\s*`\$\{(\w+)\}/g;
  for (const m of src.matchAll(re)) {
    const p = m[1].split("/:")[0].replace(/\/$/, "");
    if (!out.has(p)) out.set(p, NEXT_VAR[m[2]] ?? m[2]);
  }
  return out;
}

/** Every @RequestMapping("/api/...") in the backend, mapped to the services declaring it. */
function controllerOwners(): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  const walk = (dir: string, svc: string) => {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, svc);
      else if (e.name.endsWith(".java")) {
        const text = fs.readFileSync(full, "utf8");
        for (const m of text.matchAll(/@RequestMapping\(\s*"(\/api\/[^"]+)"/g)) {
          const p = m[1].replace(/\/$/, "");
          if (!owners.has(p)) owners.set(p, new Set());
          owners.get(p)!.add(svc);
        }
      }
    }
  };
  for (const d of fs.readdirSync(BACKEND, { withFileTypes: true })) {
    if (d.isDirectory()) walk(path.join(BACKEND, d.name, "src/main/java"), svcKey(d.name));
  }
  return owners;
}

/** nginx picks the LONGEST matching ^~ prefix, regardless of order in the file. */
function resolveThroughNginx(p: string, rules: Array<[string, string]>) {
  let best: [string, string] | null = null;
  for (const [prefix, svc] of rules) {
    if (p === prefix || p.startsWith(prefix + "/")) {
      if (!best || prefix.length > best[0].length) best = [prefix, svc];
    }
  }
  return best;
}

describe("gateway/nginx and next.config.js route to the same services", () => {
  const rules = nginxRules();
  const next = nextRoutes();
  const owners = controllerOwners();

  it("parses both routing tables and the backend controllers", () => {
    expect(rules.length).toBeGreaterThan(50);
    expect(next.size).toBeGreaterThan(50);
    expect(owners.size).toBeGreaterThan(50);
  });

  it("every real backend endpoint is reachable through nginx, at the right service", () => {
    const unrouted: string[] = [];
    const wrongService: string[] = [];

    for (const [p, wantSvc] of next) {
      if (!owners.has(p)) continue;                 // dead rewrite — breaks nothing
      if (p in ALLOWED_DIVERGENCE) continue;        // deliberate, reason recorded above
      const got = resolveThroughNginx(p, rules);
      if (!got) {
        unrouted.push(`${p} -> should reach ${wantSvc}, but NO nginx rule matches (404 in every deployed stack)`);
      } else if (got[1] !== wantSvc) {
        wrongService.push(`${p} -> next says ${wantSvc}, nginx rule "${got[0]}" sends it to ${got[1]}`);
      }
    }

    const problems = [...unrouted, ...wrongService];
    expect(
      problems,
      `\nRouting drift between next.config.js and gateway/nginx/nginx.conf.\n` +
        `These work under \`next dev\` and break in EVERY deployed stack.\n` +
        `Add the missing location block(s) to gateway/nginx/nginx.conf, or record a\n` +
        `deliberate exception in ALLOWED_DIVERGENCE with a reason.\n\n` +
        problems.map((s) => "  - " + s).join("\n") + "\n"
    ).toEqual([]);
  });

  it("the public funnel reaches the services that actually own it", () => {
    // The 2026-09-11 outage, pinned: these three must never collapse into one rule again.
    expect(resolveThroughNginx("/api/public/leads", rules)?.[1]).toBe("connect");
    expect(resolveThroughNginx("/api/public/payment/status", rules)?.[1]).toBe("payment");
    expect(resolveThroughNginx("/api/public/courses", rules)?.[1]).toBe("academy");
  });
});
