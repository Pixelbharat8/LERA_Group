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


/**
 * The guard above covered ONE importer. Three other paths created login accounts, and all three
 * used the same fixed password "Lera@123" — a constant committed to this repository:
 *
 *   UserService.importStaff        (identity)  bulk staff import
 *   IdentityClient.provisionUser   (academy)   auto-provisions TEACHER and PARENT logins
 *   the data-import admin page                 printed it on screen and in the CSV handout
 *
 * So anyone with the source could sign in as any imported teacher, parent or staff member. The
 * passwordChangeRequired flag did not close it: no server-side check consults that flag — the
 * login page and the dashboard layout redirect on it, and POST /api/auth/login issues a working
 * token regardless, so an API client never sees the prompt at all.
 */
describe("every path that creates a login account", () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const read2 = (p: string) => fs.readFileSync(path.join(repoRoot, p), "utf8");
  const code2 = (p: string) =>
    read2(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  const USER_SERVICE = "backend/identity_service/src/main/java/com/lera/identity_service/service/UserService.java";
  const IDENTITY_CLIENT = "backend/academy_service/src/main/java/com/lera/academy_service/client/IdentityClient.java";
  const IMPORT_PAGE = "frontend/app/dashboard/superadmin/data-import/page.tsx";

  it.each([
    ["bulk staff import", USER_SERVICE],
    ["teacher/parent provisioning", IDENTITY_CLIENT],
    ["the import admin page", IMPORT_PAGE],
  ])("%s ships no shared password", (_label, file) => {
    expect(code2(file), "a password in the repository is a password everyone has")
      .not.toContain("Lera@123");
  });

  it("bulk staff import draws from SecureRandom and returns the value once", () => {
    const src = read2(USER_SERVICE);
    expect(src).toMatch(/SecureRandom/);
    expect(src).toMatch(/generateImportPassword/);
    expect(src).toMatch(/temporaryPassword/);
  });

  it("auto-provisioned teacher and parent accounts get a random password nobody is shown", () => {
    const src = read2(IDENTITY_CLIENT);
    expect(src).toMatch(/SecureRandom/);
    expect(src).toMatch(/randomProvisionPassword\(\)/);
    expect(code2(IDENTITY_CLIENT)).not.toMatch(/DEFAULT_IMPORT_PASSWORD/);
  });

  it("the admin page hands out a set-password link instead of a password", () => {
    const page = read2(IMPORT_PAGE);
    expect(page).toMatch(/set-password-link/);
    expect(code2(IMPORT_PAGE)).not.toMatch(/IMPORT_DEFAULT_PASSWORD/);
  });
});
