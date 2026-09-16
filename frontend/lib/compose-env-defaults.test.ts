import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards the environment plumbing between docker-compose and each service's properties.
 *
 * Two distinct failures live here. The first is a variable the code reads and compose never
 * passes: the seeded Chairman password worked that way, and so did outbound mail and the VNPay
 * credentials — documented in .env.example, read by the service, and unreachable from a compose
 * deployment, so setting them did nothing at all.
 *
 * The second only appears once you fix the first. An EMPTY environment variable OVERRIDES a
 * property default rather than falling back to it — `${VAR:-}` in compose therefore does not mean
 * "leave it alone", it means "blank it". Passing MAIL_HOST through that way would have wiped
 * smtp.gmail.com, and VNPAY_PAY_URL the sandbox endpoint. So where a property has a real default,
 * compose has to repeat it — and this test is what keeps the two copies honest.
 */

const REPO = path.resolve(__dirname, "..", "..");
const COMPOSE = fs.readFileSync(path.join(REPO, "docker-compose.yml"), "utf8");

function properties(service: string): string {
  return fs.readFileSync(
    path.join(REPO, "backend", service, "src", "main", "resources", "application.properties"),
    "utf8"
  );
}

/** ENV_VAR -> the default written in the service's .properties, or "" when it has none. */
function propertyDefaults(service: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of properties(service).matchAll(/\$\{([A-Z][A-Z0-9_]*)(?::([^}]*))?\}/g)) {
    out.set(m[1], m[2] ?? "");
  }
  return out;
}

/** ENV_VAR -> the default compose falls back to, for vars compose passes. */
function composeDefaults(): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of COMPOSE.matchAll(/^\s{6}([A-Z][A-Z0-9_]*):\s*\$\{[A-Z][A-Z0-9_]*(?::-([^}]*))?\}/gm)) {
    out.set(m[1], m[2] ?? "");
  }
  return out;
}

const INTEGRATIONS: Array<[string, string, string[]]> = [
  ["connect_service", "outbound mail", ["MAIL_HOST", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM"]],
  ["connect_service", "mobile push", ["APNS_TEAM_ID", "APNS_KEY_ID", "APNS_BUNDLE_ID", "FCM_PROJECT_ID"]],
  ["payment_service", "VNPay", ["VNPAY_TMN_CODE", "VNPAY_HASH_SECRET", "VNPAY_PAY_URL", "VNPAY_RETURN_URL"]],
];

describe("compose environment plumbing", () => {
  it.each(INTEGRATIONS)("%s: %s settings reach the container", (_svc, _label, vars) => {
    const missing = vars.filter((v) => !new RegExp(`^\\s+${v}:`, "m").test(COMPOSE));
    expect(
      missing,
      `docker-compose does not pass ${missing.join(", ")}, so these cannot be configured in a ` +
        `compose deployment however they are set in .env`
    ).toEqual([]);
  });

  it("repeats every property default it needs to, so nothing is blanked", () => {
    const inCompose = composeDefaults();
    const wrong: string[] = [];
    for (const [service, , vars] of INTEGRATIONS) {
      const declared = propertyDefaults(service);
      for (const v of vars) {
        if (!inCompose.has(v)) continue;
        const propertyDefault = declared.get(v) ?? "";
        if (propertyDefault === "") continue;          // nothing to preserve
        if (inCompose.get(v) !== propertyDefault) {
          wrong.push(`${v}: compose falls back to "${inCompose.get(v)}", properties to "${propertyDefault}"`);
        }
      }
    }
    expect(
      wrong,
      `An empty environment variable overrides a property default rather than falling back to ` +
        `it, so compose must repeat the default exactly:\n  ${wrong.join("\n  ")}`
    ).toEqual([]);
  });
});
