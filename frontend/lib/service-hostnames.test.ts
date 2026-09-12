import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards the 2026-09-12 outage class: an underscore in a service hostname.
 *
 * Every backend runs on embedded Tomcat, and Tomcat validates the Host header against the
 * hostname grammar in RFC 952/1123 — where `_` is not a legal character. A request to
 * `http://academy_service:8082/...` is answered with a bare `400 Bad Request` by the connector,
 * before Spring, before any filter, with no application log line. The Compose service names all
 * contain underscores, so EVERY service-to-service call in a containerised stack returned 400.
 *
 * Because those clients fail closed, the symptom was never an error — it was a silent denial.
 * A student could not see their own attendance: attendance_service asked academy_service "may
 * this user view this student?", got 400, and denied. Notifications, payroll generation, the AI
 * tutor and lead→placement sync were all dead the same way, in every deployed stack, while every
 * container reported healthy (healthchecks use `localhost`, which has no underscore).
 *
 * The fix is a hyphenated network alias per service. This test fails if any configured
 * inter-service URL goes back to an underscored host.
 */

const REPO = path.resolve(__dirname, "..", "..");
const COMPOSE = path.join(REPO, "docker-compose.yml");
const CFN = path.join(REPO, "aws", "cloudformation-template.yaml");

/** Every `http://host:port` that a service is configured to call. */
function serviceUrls(file: string): { where: string; url: string; host: string }[] {
  if (!fs.existsSync(file)) return [];
  const found: { where: string; url: string; host: string }[] = [];
  fs.readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      // Only configuration values, never comments explaining the bug.
      if (/^\s*#/.test(line)) return;
      const m = line.match(/https?:\/\/([A-Za-z0-9_.-]+):(\d{2,5})/);
      if (!m) return;
      const host = m[1];
      if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return;
      found.push({ where: `${path.basename(file)}:${i + 1}`, url: m[0], host });
    });
  return found;
}

describe("inter-service hostnames", () => {
  it("no configured service URL uses an underscored host (Tomcat 400s on those)", () => {
    const bad = [...serviceUrls(COMPOSE), ...serviceUrls(CFN)]
      .filter((u) => u.host.includes("_"))
      .map((u) => `${u.where}  ${u.url}  (host "${u.host}" has an underscore)`);

    expect(
      bad,
      `\nUnderscored hostname in an inter-service URL.\n` +
        `Tomcat rejects these with a bare 400 before Spring sees the request, and the callers\n` +
        `fail closed — so the symptom is a silent permission denial, not an error.\n` +
        `Use the hyphenated network alias (e.g. academy-service, not academy_service).\n\n` +
        bad.map((s) => "  - " + s).join("\n") + "\n"
    ).toEqual([]);
  });

  it("every Service Connect DNS alias in the CloudFormation template is hostname-legal", () => {
    if (!fs.existsSync(CFN)) return;
    const bad = fs
      .readFileSync(CFN, "utf8")
      .split("\n")
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => /^\s*DnsName:\s*\S+/.test(l) && l.includes("_"))
      .map(({ l, i }) => `cloudformation-template.yaml:${i + 1}  ${l.trim()}`);
    expect(bad, "\nService Connect alias with an underscore:\n" + bad.join("\n")).toEqual([]);
  });

  it("each backend service publishes the hyphenated alias those URLs resolve", () => {
    const compose = fs.readFileSync(COMPOSE, "utf8");
    const referenced = new Set(
      serviceUrls(COMPOSE)
        .filter((u) => !u.host.includes("_"))
        .map((u) => u.host)
    );
    const missing = Array.from(referenced).filter(
      (host) => !new RegExp(`^\\s*-\\s+${host}\\b`, "m").test(compose)
    );
    expect(
      missing,
      `\nThese hosts are used in a service URL but no compose service declares them as a\n` +
        `network alias, so they will not resolve:\n` +
        missing.map((s) => "  - " + s).join("\n") + "\n"
    ).toEqual([]);
  });
});
