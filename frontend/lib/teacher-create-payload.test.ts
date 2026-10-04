import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The teacher form marks Email as required (`required` + "Email *"), and the create payload
 * omitted it. So an administrator was forced to type an address that was then discarded: the
 * list's Email column rendered blank, and because the server provisions the TEACHER login from
 * that address, the teacher ended up with no user account and no way to sign in. Only
 * /api/teachers/bulk provisioned a login; the single create — the path an admin actually uses —
 * did not.
 */
const REPO = path.resolve(__dirname, "..", "..");
const page = fs.readFileSync(
  path.join(REPO, "frontend/app/dashboard/academy/teachers/page.tsx"), "utf8");
const controller = fs.readFileSync(
  path.join(REPO, "backend/academy_service/src/main/java/com/lera/academy_service/controller/TeacherController.java"),
  "utf8");

/** The object literal passed as the POST /api/teachers body. */
function createBody(): string {
  const i = page.indexOf('apiFetch("/api/teachers"');
  expect(i, "the create call moved; this guard is reading the wrong code").toBeGreaterThan(-1);
  const open = page.indexOf("JSON.stringify({", i);
  expect(open).toBeGreaterThan(-1);
  let depth = 0;
  for (let k = page.indexOf("{", open); k < page.length; k++) {
    if (page[k] === "{") depth++;
    else if (page[k] === "}") {
      depth--;
      if (depth === 0) return page.slice(open, k + 1);
    }
  }
  throw new Error("unbalanced create body");
}

describe("creating a teacher produces an account that can sign in", () => {
  it("sends the email the form insists on", () => {
    expect(createBody()).toMatch(/\bemail:\s*formData\.email\b/);
  });

  it("still marks email required, so the two halves agree", () => {
    // If the field ever stops being required, the server must stop depending on it.
    const i = page.indexOf("Email *");
    expect(i, "the Email label changed").toBeGreaterThan(-1);
    expect(page.slice(i, i + 400)).toMatch(/required/);
  });

  it("provisions a login on the single create, not only on bulk", () => {
    const single = controller.slice(
      controller.indexOf("createTeacher("),
      controller.indexOf("@PostMapping(\"/bulk\")"),
    );
    expect(single, "the single create must provision a TEACHER login like /bulk does")
      .toMatch(/identityClient\.provisionUser\([\s\S]{0,200}?"TEACHER"/);
    expect(single, "only provision when the caller has not already linked a user")
      .toMatch(/getUserId\(\)\s*==\s*null/);
  });

  it("bulk still provisions too — the behaviour was copied, not moved", () => {
    const bulk = controller.slice(controller.indexOf("@PostMapping(\"/bulk\")"));
    expect(bulk).toMatch(/identityClient\.provisionUser\([\s\S]{0,200}?"TEACHER"/);
  });
});
