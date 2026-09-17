import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The CRM follow-up queue is a list of people to call, and it could not say who any of them
 * were. A Followup row stores leadId — there is no relation and no denormalised name — so
 * `f.lead?.parentName || f.leadName` resolved to nothing and every row read "Unknown Lead".
 *
 * The rest of the row was read off the wrong columns too:
 *   - the due date came from nextFollowupDate, a date-only column, falling back to TODAY when
 *     it was null, so an undated follow-up presented itself as due now;
 *   - the time was parsed out of that same date-only column, so it was always blank, while the
 *     real timestamp (scheduledAt, NOT NULL) went unread;
 *   - the displayed status was synthesised from `outcome` alone and ignored the real status
 *     column, which inverts the meaning: a PENDING call with outcome NO_ANSWER showed as
 *     "Completed", and a DONE one with no outcome showed as "Pending".
 *   - one of the four tiles counted "Scheduled", a state the entity does not have, so it was
 *     structurally always zero.
 */

const REPO = path.resolve(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");

const CONNECT = "backend/connect_service/src/main/java/com/lera/connect_service";
const entity = read(`${CONNECT}/entity/Followup.java`);
const controller = read(`${CONNECT}/controller/FollowupController.java`);
const page = read("frontend/app/dashboard/crm/followups/page.tsx");

describe("follow-up rows carry no lead information of their own", () => {
  it("the entity has an id and no relation", () => {
    expect(entity).toMatch(/private UUID leadId;/);
    expect(entity).not.toMatch(/@ManyToOne/);
    expect(entity).not.toMatch(/private String leadName;/);
  });

  it("every listing resolves the lead, batched", () => {
    for (const ep of ["getAllFollowups", "getFollowupsByLead"]) {
      const body = controller.slice(controller.indexOf(ep), controller.indexOf(ep) + 700);
      expect(body, `${ep} must resolve lead names`).toMatch(/withLeadNames\(/);
    }
    expect(controller).toMatch(/leadRepository\.findAllById\(leadIds\)/);
    expect(controller).toMatch(/row\.put\("leadName"/);
  });

  it("the page reads the resolved name, not a relation that does not exist", () => {
    expect(page).not.toMatch(/f\.lead\?\.parentName/);
    expect(page).toMatch(/f\.leadName \|\| f\.studentName/);
  });
});

describe("when a follow-up is due", () => {
  it("scheduledAt is the NOT NULL timestamp, and is what the page reads", () => {
    expect(entity).toMatch(/@Column\(name = "scheduled_at", nullable = false\)/);
    expect(page).toMatch(/f\.scheduledAt \? new Date\(f\.scheduledAt\) : null/);
  });

  it("never invents today's date for an undated follow-up", () => {
    expect(page).not.toMatch(/new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]\s*,/);
  });
});

describe("follow-up status", () => {
  it("comes from the status column, whose values are PENDING / DONE / SKIPPED", () => {
    expect(entity).toMatch(/PENDING, DONE, SKIPPED/);
    expect(page).toMatch(/String\(f\.status \|\| "PENDING"\)\.toUpperCase\(\)/);
  });

  it("is not synthesised from outcome", () => {
    expect(page).not.toMatch(/f\.outcome === "INTERESTED" \?/);
  });

  it("counts no tile on a state the entity cannot produce", () => {
    expect(page).not.toMatch(/f\.status === "Scheduled"/);
    for (const s of ["Pending", "Overdue", "Completed", "Skipped"]) {
      expect(page, `the ${s} tile should count a state that can actually occur`)
        .toMatch(new RegExp(`f\\.status === "${s}"`));
    }
  });
});
