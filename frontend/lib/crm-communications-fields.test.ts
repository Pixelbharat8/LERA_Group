import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The CRM communications log was broken in both directions.
 *
 * READ: EmailLog's columns are emailTo / emailSubject / emailStatus. The page read
 * toEmail / subject / status, so the To, Subject and Status columns were blank on every row.
 * Both logs also show who the contact was with, but a row stores only leadId — no relation,
 * no name — so that was blank too.
 *
 * WRITE: the compose form POSTed {toEmail, subject, body, status} straight at an endpoint that
 * binds the EmailLog entity. Unknown keys are dropped silently, so all four vanished — and
 * email_to is NOT NULL, so the insert then failed. No email could be logged at all, and the
 * failure was swallowed into console.error, leaving the Send button looking dead.
 */

const REPO = path.resolve(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");

const CONNECT = "backend/connect_service/src/main/java/com/lera/connect_service";
const emailEntity = read(`${CONNECT}/entity/EmailLog.java`);
const emailController = read(`${CONNECT}/controller/EmailLogController.java`);
const callController = read(`${CONNECT}/controller/CallLogController.java`);
const page = read("frontend/app/dashboard/crm/communications/page.tsx");

describe("the email log's column names are the contract", () => {
  it("is emailTo / emailSubject / emailStatus, and email_to is NOT NULL", () => {
    expect(emailEntity).toMatch(/@Column\(name = "email_to", nullable = false/);
    expect(emailEntity).toMatch(/private String emailSubject;/);
    expect(emailEntity).not.toMatch(/private String (toEmail|subject);/);
  });

  it("the page writes those names, so the row is not saved empty", () => {
    const send = page.slice(page.indexOf("handleSendEmail"), page.indexOf("handleSendEmail") + 900);
    expect(send).toMatch(/emailStatus: "SENT"/);
    expect(page).toMatch(/emailForm\.emailTo/);
    expect(page).toMatch(/emailForm\.emailSubject/);
    expect(page).not.toMatch(/emailForm\.(toEmail|subject|body)\b/);
  });

  it("the page reads those names, so the columns are not blank", () => {
    expect(page).toMatch(/email\.emailTo/);
    expect(page).toMatch(/email\.emailSubject/);
    expect(page).not.toMatch(/email\.(toEmail|subject)\b/);
  });

  it("a failed send says so instead of looking dead", () => {
    const send = page.slice(page.indexOf("handleSendEmail"), page.indexOf("handleSendEmail") + 900);
    expect(send).toMatch(/toast\(.*(Could not|error)/i);
  });
});

describe("both logs say who the contact was with", () => {
  it("resolves lead names, batched, on each list", () => {
    for (const c of [emailController, callController]) {
      expect(c).toMatch(/withLeadNames\(/);
      expect(c).toMatch(/leadRepository\.findAllById\(leadIds\)/);
      expect(c).toMatch(/"leadName"/);
    }
  });
});

/**
 * A lead created through the public website records which programme the enquiry was about, in
 * Lead.interestedProgramId. The CRM leads table has an "Interested Course" column and read
 * `interestedCourse`, a field no lead has — so the single most useful thing the enquiry told
 * us was invisible on the screen the sales team works from.
 *
 * NOT fixed here, and deliberately: the internal "Add Lead" form still writes the course as
 * prose into `notes` instead of setting interestedProgramId, so leads added by hand have
 * nothing to resolve. Turning that free-text box into a programme picker changes what staff
 * can enter, which is LERA's call.
 */
describe("the interested programme on a lead", () => {
  const REPO2 = path.resolve(__dirname, "..", "..");
  const leadEntity = fs.readFileSync(
    path.join(REPO2, "backend/connect_service/src/main/java/com/lera/connect_service/entity/Lead.java"),
    "utf8"
  );
  const publicController = fs.readFileSync(
    path.join(REPO2, "backend/connect_service/src/main/java/com/lera/connect_service/controller/PublicLeadController.java"),
    "utf8"
  );
  const leadsPage = fs.readFileSync(
    path.join(REPO2, "frontend/app/dashboard/crm/leads/page.tsx"),
    "utf8"
  );

  it("is stored as an id, and the public site really does set it", () => {
    expect(leadEntity).toMatch(/private UUID interestedProgramId;/);
    expect(leadEntity).not.toMatch(/private String interestedCourse;/);
    expect(publicController).toMatch(/\.interestedProgramId\(req\.getInterestedProgramId\(\)\)/);
  });

  it("is resolved to a name for the column that displays it", () => {
    expect(leadsPage).toMatch(/apiFetch\("\/api\/programs"\)/);
    expect(leadsPage).toMatch(/p\.id === l\.interestedProgramId/);
  });
});
