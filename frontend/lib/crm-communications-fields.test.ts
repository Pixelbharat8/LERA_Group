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
