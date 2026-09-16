import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards a cross-layer drift, like service-hostnames.test.ts, which also reads docker-compose.
 *
 * DataLoader creates the Chairman, CEO and admin accounts on first boot. Their passwords come
 * from lera.seed.* — and when those are unset it generates a random one and logs it exactly once.
 * For a deployment that means the only record of the Chairman's password is a single line in a
 * container log, and if that line is missed the account cannot be signed into at all.
 *
 * application-docker.properties says the passwords come "from LERA_SEED_* env vars" and
 * .env.example lists all three. docker-compose.yml passed NONE of them to identity_service, so
 * setting them had no effect whatsoever and the random branch always won. Nothing connected the
 * documentation to the container, which is exactly the gap this closes.
 */

const REPO = path.resolve(__dirname, "..", "..");
const COMPOSE = path.join(REPO, "docker-compose.yml");
const IDENTITY_PROPS = path.join(
  REPO, "backend", "identity_service", "src", "main", "resources", "application.properties"
);

const SEED_VARS = [
  "LERA_SEED_CHAIRMAN_PASSWORD",
  "LERA_SEED_CEO_PASSWORD",
  "LERA_SEED_ADMIN_PASSWORD",
] as const;

/** The identity_service block of the compose file, up to the next service. */
function identityServiceBlock(): string {
  const src = fs.readFileSync(COMPOSE, "utf8");
  const start = src.indexOf("\n  identity_service:\n");
  if (start === -1) throw new Error("identity_service not found in docker-compose.yml");
  const rest = src.slice(start + 1);
  const next = rest.search(/\n {2}[a-z_]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("seed password plumbing", () => {
  it("compose passes every seed password into identity_service", () => {
    const block = identityServiceBlock();
    const missing = SEED_VARS.filter((v) => !block.includes(v));
    expect(
      missing,
      `docker-compose does not pass ${missing.join(", ")} to identity_service. Setting them in ` +
        `.env then does nothing, and DataLoader falls back to a random password written to the ` +
        `log exactly once — which is the only record of a deployed Chairman's password.`
    ).toEqual([]);
  });

  it("identity declares the hyphenated properties those variables feed", () => {
    const props = fs.readFileSync(IDENTITY_PROPS, "utf8");
    for (const key of ["admin-password", "chairman-password", "ceo-password"]) {
      expect(
        new RegExp(`^lera\\.seed\\.${key}\\s*=`, "m").test(props),
        `lera.seed.${key} should be declared explicitly, the way lera.internal.api-key is — ` +
          `hyphenated keys have failed to bind from the environment in this codebase before`
      ).toBe(true);
    }
  });

  it("the example env file still documents them, so operators know to set them", () => {
    const example = fs.readFileSync(path.join(REPO, ".env.example"), "utf8");
    for (const v of SEED_VARS) {
      expect(example.includes(v), `${v} should stay documented in .env.example`).toBe(true);
    }
  });
});
