import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The password issued to every bulk-imported account used to be built out of the account
 * holder's own details: the first three letters of their name plus the last four digits of
 * their phone number plus "!". "Nguyễn Văn An" on 0987654321 became "ngu4321!".
 *
 * Anyone holding a class roster or a staff list could therefore work out the password for every
 * account on it — no guessing involved. The accounts were created ACTIVE, were never asked to
 * change it, and imported roles include TEACHER, whose accounts can read student records.
 *
 * This asserts the generator cannot go back to deriving a password from the person, and that
 * imported accounts are still told to change it.
 */

const REPO = path.resolve(__dirname, "..", "..");
const IMPORTER = path.join(
  REPO, "backend", "academy_service", "src", "main", "java",
  "com", "lera", "academy_service", "controller", "ExcelImportController.java"
);

/** Source with comments stripped: the javadoc describes the old scheme on purpose. */
function code(): string {
  return fs
    .readFileSync(IMPORTER, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("bulk-import account passwords", () => {
  it("are generated from a cryptographically secure source", () => {
    const src = code();
    expect(src, "password generation must use SecureRandom").toMatch(/SecureRandom/);
    expect(
      /new Random\(/.test(src),
      "java.util.Random is seeded from the clock and is predictable — not for passwords"
    ).toBe(false);
  });

  it("are not derived from the account holder's name or phone number", () => {
    const src = code();
    const generator = src.match(/private String generateTemporaryPassword\(\)[\s\S]*?\n    \}/);
    expect(generator, "generateTemporaryPassword not found").not.toBeNull();
    const body = generator![0];
    for (const leak of ["fullname", "phone", "email", "studentCode"]) {
      expect(
        body.includes(leak),
        `the password must not be built from ${leak} — that is public information`
      ).toBe(false);
    }
  });

  it("must be changed at first login", () => {
    expect(
      code(),
      "an imported account ships with a temporary password and must be flagged to change it"
    ).toMatch(/passwordChangeRequired"?\s*,\s*true/);
  });
});
