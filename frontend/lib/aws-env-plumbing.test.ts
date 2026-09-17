import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The same plumbing guard as compose-env-defaults, for the other deployment target.
 *
 * Everything that was wrong with docker-compose was also wrong with CloudFormation, and stayed
 * wrong after compose was fixed: the template passed DB_PASSWORD, JWT_SECRET and
 * LERA_INTERNAL_API_KEY and nothing else. So an AWS deploy seeded Chairman/CEO/admin with random
 * passwords logged once, could send no mail at all, took no VNPay payment and delivered no push
 * notification — every deployment bug that had just been fixed for compose, reproduced.
 *
 * Two traps this also has to hold shut:
 *   - an EMPTY environment variable OVERRIDES a property default, so a parameter whose Default is
 *     blank must not be plumbed where the property has a real default to lose;
 *   - an ECS `Secrets` entry naming a Secrets Manager secret that does not exist stops the task
 *     from starting, so every optional secret has to sit behind a Condition.
 */

const REPO = path.resolve(__dirname, "..", "..");
const TEMPLATE = fs.readFileSync(path.join(REPO, "aws", "cloudformation-template.yaml"), "utf8");
const DEPLOY = fs.readFileSync(path.join(REPO, "aws", "deploy-aws.sh"), "utf8");

function properties(service: string): string {
  return fs.readFileSync(
    path.join(REPO, "backend", service, "src", "main", "resources", "application.properties"),
    "utf8"
  );
}

function propertyDefaults(service: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of properties(service).matchAll(/\$\{([A-Z][A-Z0-9_]*)(?::([^}]*))?\}/g)) {
    out.set(m[1], m[2] ?? "");
  }
  return out;
}

/**
 * CloudFormation parameter name -> its Default, or null when it declares none.
 * The distinction matters: `Default: ''` is an optional parameter, no Default at all is one
 * `aws cloudformation deploy` refuses to run without.
 */
function templateParameters(): Map<string, string | null> {
  const block = TEMPLATE.slice(TEMPLATE.indexOf("Parameters:"), TEMPLATE.indexOf("\nConditions:"));
  const out = new Map<string, string | null>();
  for (const m of block.matchAll(/^  ([A-Za-z][A-Za-z0-9]*):\n((?:    .*\n|\n)*)/gm)) {
    const d = m[2].match(/^    Default:\s*(.*)$/m);
    out.set(m[1], d ? d[1].trim().replace(/^['"]|['"]$/g, "") : null);
  }
  return out;
}

/** Env vars the template hands to containers, via Environment or Secrets. */
function plumbedVars(): Set<string> {
  return new Set(Array.from(TEMPLATE.matchAll(/^\s+- ?Name: ([A-Z][A-Z0-9_]*)$/gm), (m) => m[1]));
}

const INTEGRATIONS: Array<[string, string, string[]]> = [
  ["identity_service", "seeded accounts", [
    "LERA_SEED_CHAIRMAN_PASSWORD", "LERA_SEED_CEO_PASSWORD", "LERA_SEED_ADMIN_PASSWORD"]],
  ["connect_service", "outbound mail", [
    "MAIL_ENABLED", "MAIL_HOST", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM"]],
  ["connect_service", "mobile push", [
    "APNS_TEAM_ID", "APNS_KEY_ID", "APNS_BUNDLE_ID", "APNS_KEY_PATH", "APNS_SANDBOX",
    "FCM_PROJECT_ID", "FCM_SERVICE_ACCOUNT_PATH"]],
  ["payment_service", "VNPay", [
    "VNPAY_TMN_CODE", "VNPAY_HASH_SECRET", "VNPAY_PAY_URL", "VNPAY_RETURN_URL"]],
];

describe("CloudFormation environment plumbing", () => {
  const plumbed = plumbedVars();

  it.each(INTEGRATIONS)("%s: %s settings reach the task definition", (_svc, _label, vars) => {
    const missing = vars.filter((v) => !plumbed.has(v));
    expect(
      missing,
      `the CloudFormation template never passes ${missing.join(", ")}, so an AWS deployment ` +
        `cannot configure this however the parameters are set`
    ).toEqual([]);
  });

  it("carries over every property default rather than blanking it", () => {
    const params = templateParameters();
    // parameter name in the template <- the env var it is plumbed as
    const PARAM_FOR: Record<string, string> = {
      MAIL_ENABLED: "MailEnabled", MAIL_HOST: "MailHost", MAIL_PORT: "MailPort",
      MAIL_FROM: "MailFrom", APNS_BUNDLE_ID: "ApnsBundleId", APNS_SANDBOX: "ApnsSandbox",
      VNPAY_PAY_URL: "VnpayPayUrl",
    };
    // VNPAY_RETURN_URL is deliberately absent from PARAM_FOR: its property default points at
    // localhost:8083, which is worse than useless on AWS, so the template computes it from the
    // CloudFront domain instead of ever passing the parameter through blank. Covered below.
    const DERIVED = new Set(["VNPAY_RETURN_URL"]);
    const wrong: string[] = [];
    for (const [service, , vars] of INTEGRATIONS) {
      const declared = propertyDefaults(service);
      for (const v of vars) {
        if (DERIVED.has(v)) continue;
        const propertyDefault = declared.get(v) ?? "";
        if (propertyDefault === "") continue;
        const param = PARAM_FOR[v];
        if (!param) { wrong.push(`${v} has default "${propertyDefault}" but no template parameter`); continue; }
        if (params.get(param) !== propertyDefault) {
          wrong.push(`${v}: parameter ${param} defaults to "${params.get(param)}", properties to "${propertyDefault}"`);
        }
      }
    }
    expect(
      wrong,
      `An empty environment variable overrides a property default, so the template's parameter ` +
        `Default must repeat it exactly:\n  ${wrong.join("\n  ")}`
    ).toEqual([]);
  });

  it("never lets VNPay's return URL fall back to localhost", () => {
    const payment = TEMPLATE.slice(TEMPLATE.indexOf("Name: VNPAY_RETURN_URL"));
    const entry = payment.slice(0, 400);
    expect(entry, "a blank VNPAY_RETURN_URL would override the property default with an empty " +
      "string, and the property default itself is http://localhost:8083 — neither is reachable " +
      "from a payer's browser, so the template has to derive it")
      .toMatch(/HasVnpayReturnUrl/);
    expect(entry).toMatch(/CloudFrontDistribution\.DomainName.*vnpay-return/);
  });

  it("guards every optional secret behind a Condition", () => {
    const optional = ["SeedChairmanPasswordSecret", "SeedCeoPasswordSecret", "SeedAdminPasswordSecret",
                      "MailPasswordSecret", "VnpayHashSecretSecret", "AnthropicApiKeySecret"];
    for (const name of optional) {
      const decl = TEMPLATE.slice(TEMPLATE.indexOf(`\n  ${name}:`));
      expect(decl.slice(0, 200), `${name} must be conditional — an ECS Secrets entry pointing at a ` +
        `secret that was never created stops the task from starting`).toMatch(/Condition: Has/);
    }
  });

  it("lets the execution role read each secret it hands out", () => {
    const policy = TEMPLATE.slice(TEMPLATE.indexOf("secretsmanager:GetSecretValue"));
    for (const c of ["HasChairmanSeed", "HasMailPassword", "HasVnpayHashSecret", "HasAnthropicKey"]) {
      expect(policy.slice(0, 1200)).toContain(c);
    }
  });
});

describe("the deploy script", () => {
  it("defaults no credential — this file is committed", () => {
    for (const bad of ["YourSecurePassword", "your-super-secret-jwt-key"]) {
      expect(DEPLOY, `a committed default IS a published credential`).not.toContain(bad);
    }
    expect(DEPLOY).toMatch(/require DB_PASSWORD 8/);
    expect(DEPLOY).toMatch(/require JWT_SECRET 32/);
    expect(DEPLOY).toMatch(/require LERA_INTERNAL_API_KEY 16/);
  });

  it("passes every parameter the template has no default for", () => {
    const params = templateParameters();
    const required = Array.from(params.entries())
      .filter(([, def]) => def === null)
      .map(([name]) => name);
    expect(required.length, "expected the template to still have required parameters").toBeGreaterThan(0);
    const missing = required.filter((p) => !new RegExp(`${p}=`).test(DEPLOY));
    expect(
      missing,
      `aws cloudformation deploy fails outright when a parameter with no Default is omitted: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("warns when the Chairman seed password is unset", () => {
    expect(DEPLOY).toMatch(/LERA_SEED_CHAIRMAN_PASSWORD is unset/);
  });
});
