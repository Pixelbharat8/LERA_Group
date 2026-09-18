import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * /dashboard/superadmin/crm is a second lead console, not linked from the sidebar (only its
 * sub-paths are) but reachable by URL. It was broken end to end, and two of the failures wrote:
 *
 *   READ   — it rendered lead.name / email / phone / source. The API's Lead carries parentName,
 *            parentEmail, parentPhone and utmSource, so every column of the table was blank.
 *   CREATE — it POSTed those same names. Unknown keys are dropped, parent_name and parent_phone
 *            are NOT NULL, and LeadController rejects either blank, so creating a lead here
 *            always failed — silently, into console.error.
 *   EDIT   — updateLead only applies non-null fields, so an edit changed nothing but status.
 *   STATUS — it compared and wrote lowercase ("new", "contacted"). The stored vocabulary is
 *            uppercase, so the five counters were always zero and the follow-up button wrote a
 *            status no other screen in the platform recognises. That one corrupts data.
 *   DEALS  — hydrated lead names from the `leads` state while both fetches were still in flight,
 *            so every deal read "Unknown" whatever the data said.
 *
 * Repaired rather than deleted: whether this duplicate screen should exist at all is LERA's
 * call, but leaving a reachable page that can corrupt a lead's status is not.
 */

const REPO = path.resolve(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");

const leadEntity = read(
  "backend/connect_service/src/main/java/com/lera/connect_service/entity/Lead.java"
);
const leadController = read(
  "backend/connect_service/src/main/java/com/lera/connect_service/controller/LeadController.java"
);
const page = read("frontend/app/dashboard/superadmin/crm/page.tsx");
const layout = read("frontend/app/dashboard/layout.tsx");

describe("the Lead entity is the contract", () => {
  it("names the contact parentName / parentPhone / parentEmail", () => {
    for (const f of ["parentName", "parentPhone", "parentEmail"]) {
      expect(leadEntity).toMatch(new RegExp(`private String ${f};`));
    }
    expect(leadEntity).not.toMatch(/private String (name|phone|email);/);
  });

  it("rejects a lead with no name or phone", () => {
    expect(leadController).toMatch(/getParentName\(\) == null \|\| .*isBlank\(\)/s);
  });

  it("stores status uppercase", () => {
    expect(leadEntity).toMatch(/NEW, CONTACTED, QUALIFIED/);
  });
});

describe("the superadmin lead console", () => {
  it("maps the API's field names before rendering", () => {
    expect(page).toMatch(/name: l\.parentName/);
    expect(page).toMatch(/phone: l\.parentPhone/);
    expect(page).toMatch(/source: l\.utmSource/);
  });

  it("writes the field names the entity requires", () => {
    const submit = page.slice(page.indexOf("const handleSubmit"), page.indexOf("const handleEdit"));
    expect(submit).toMatch(/parentName: formData\.name/);
    expect(submit).toMatch(/parentPhone: formData\.phone/);
    expect(submit).not.toMatch(/JSON\.stringify\(formData\)/);
  });

  it("uses the stored uppercase status vocabulary, so nothing is written back lowercase", () => {
    for (const s of ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]) {
      expect(page).toMatch(new RegExp(`l\\.status === "${s}"`));
    }
    for (const s of ["new", "contacted", "qualified", "converted", "lost"]) {
      expect(page, `lowercase "${s}" matches nothing and corrupts the row if written`)
        .not.toMatch(new RegExp(`status === "${s}"`));
    }
  });

  it("advances a lead by sending only the status, not the view object", () => {
    const f = page.slice(page.indexOf("const handleFollowUp"), page.indexOf("const handleDelete"));
    expect(f).toMatch(/JSON\.stringify\(\{ status: newStatus \}\)/);
    expect(f).not.toMatch(/\.\.\.lead/);
  });

  it("names deals from leads that have actually loaded", () => {
    expect(page).toMatch(/fetchDeals = async \(knownLeads: Lead\[\]\)/);
    expect(page).toMatch(/fetchLeads\(\)\.then\(fetchDeals\)/);
  });

  it("tells the user when a save fails instead of only logging it", () => {
    expect(page).toMatch(/setSaveError\(/);
  });

  it("is still not linked from the sidebar — this records that, it does not endorse it", () => {
    expect(layout).not.toMatch(/href: "\/dashboard\/superadmin\/crm"/);
  });
});
