import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Creating a student optionally creates its login through POST /api/auth/register. Only an
 * org-wide admin (Chairman/CEO/Director/Super Admin) gets an ACTIVE account out of that call;
 * AuthController computes `privileged = isInternal || isAuthenticatedOrgWideAdmin()`, and a
 * CENTER_MANAGER is not org-wide. Measured: the call returns 200, the row lands PENDING/PENDING,
 * and the student's own login is then refused with 400.
 *
 * The server says so plainly — the response carries status, approvalStatus and a message about
 * pending approval. This screen read only `user.id` and announced "Student created successfully!",
 * so whoever typed the password had no way to know the account could not be used.
 */
const REPO = path.resolve(__dirname, "..", "..");
const page = fs.readFileSync(
  path.join(REPO, "frontend/app/dashboard/academy/students/page.tsx"), "utf8");
const authController = fs.readFileSync(
  path.join(REPO, "backend/identity_service/src/main/java/com/lera/identity_service/controller/AuthController.java"),
  "utf8");

describe("a student login that needs approval says so", () => {
  it("reads the status the register response returns", () => {
    expect(page).toMatch(/userResponse\.user\?\.status\s*===\s*"PENDING"/);
    expect(page).toMatch(/approvalStatus\s*===\s*"PENDING"/);
  });

  it("does not announce plain success when the login is pending", () => {
    const i = page.indexOf("setSuccessMessage(");
    expect(i).toBeGreaterThan(-1);
    const call = page.slice(i, i + 500);
    expect(call, "the pending case must be distinguished").toMatch(/pendingApproval/);
    expect(call).toMatch(/PENDING APPROVAL/);
  });

  it("is still needed, because registration is still org-wide only", () => {
    // If CENTER_MANAGER is ever allowed to mint ACTIVE accounts, this warning becomes dead
    // code and should go — but that is a privilege decision, and until it is taken the
    // warning is the only thing standing between an admin and an unusable login.
    const i = authController.indexOf("isAuthenticatedOrgWideAdmin()");
    expect(i).toBeGreaterThan(-1);
    const helper = authController.slice(authController.indexOf("private boolean isAuthenticatedOrgWideAdmin"));
    expect(helper.slice(0, 600), "CENTER_MANAGER is deliberately not org-wide")
      .not.toMatch(/ROLE_CENTER_MANAGER/);
  });
});
