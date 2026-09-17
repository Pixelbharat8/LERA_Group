import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards the WRITE side of the field-drift class, which is the dangerous half.
 *
 * Jackson's FAIL_ON_UNKNOWN_PROPERTIES is disabled across these services, so any key in a POST
 * body that is not a field on the target entity is dropped silently. The request still returns
 * 200 and the UI reports success — while what the user typed was never stored. Found this way:
 *
 *   - superadmin/centers/add REQUIRED a centre admin name and email, nested them under `admin`,
 *     and a Center has no such field — the centre was created with no manager at all;
 *   - the FAQ editor sent `sortOrder` while the column is `display_order`, so the ordering staff
 *     chose never reached the public site;
 *   - payments/fee-rules posted `type`/`status` instead of `calculationType`/`isActive`.
 *
 * This checks the specific bodies that were wrong, against the real field lists in the Java, so
 * a rename on either side is caught rather than silently dropping data again.
 */

const REPO = path.resolve(__dirname, "..", "..");

function entityFields(...segments: string[]): Set<string> {
  const src = fs.readFileSync(path.join(REPO, ...segments), "utf8");
  const fields = new Set(
    Array.from(src.matchAll(/private\s+[A-Za-z0-9_<>,.]+\s+([a-zA-Z_][A-Za-z0-9_]*)\s*[;=]/g)).map((m) => m[1])
  );
  if (fields.size === 0) throw new Error(`no fields parsed from ${segments.join("/")}`);
  return fields;
}

/** Source with comments stripped — a comment explaining an old field name is not a use of it. */
function pageSource(...segments: string[]): string {
  return fs
    .readFileSync(path.join(REPO, "frontend", "app", "dashboard", ...segments), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("write bodies match the entity they are saved into", () => {
  it("the FAQ editor writes the ordering field the column actually has", () => {
    const faq = entityFields(
      "backend", "academy_service", "src", "main", "java",
      "com", "lera", "academy_service", "entity", "Faq.java"
    );
    expect(faq.has("displayOrder"), "Faq should carry displayOrder").toBe(true);

    const page = pageSource("superadmin", "public-website", "faq", "page.tsx");
    expect(
      /\bsortOrder\b/.test(page),
      "The FAQ editor uses sortOrder, which a Faq does not have — the order will be dropped on save"
    ).toBe(false);
    expect(/\bdisplayOrder\b/.test(page)).toBe(true);
  });

  it("creating a centre does not post fields a centre has no room for", () => {
    const center = entityFields(
      "backend", "identity_service", "src", "main", "java",
      "com", "lera", "identity_service", "entity", "Center.java"
    );
    expect(center.has("managerId"), "Center should carry managerId").toBe(true);
    expect(center.has("admin"), "Center has no `admin` field").toBe(false);

    const page = pageSource("superadmin", "centers", "add", "page.tsx");
    const body = page.match(/body:\s*JSON\.stringify\(\s*\{([\s\S]*?)\}\s*\)/);
    if (!body) throw new Error("no POST body found in the add-centre page");
    const keys = Array.from(body[1].matchAll(/^\s*([a-zA-Z_][A-Za-z0-9_]*)\s*:/gm)).map((m) => m[1]);
    const unknown = keys.filter((k) => !center.has(k));
    expect(
      unknown,
      `The add-centre form posts ${unknown.join(", ")}, which a Center does not have. Those keys ` +
        `are dropped silently, so whatever was typed into them is not saved.`
    ).toEqual([]);
  });
});
