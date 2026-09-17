/**
 * POST /api/leaves/apply binds directly onto the TeacherStaffLeave entity, and the guard in
 * front of it rejects a body with no centerId ("centerId required on leave", 400).
 * /dashboard/staff/attendance posted its raw form — startDate/endDate/leaveType/reason, with
 * no userId, centerId, userType or requestedBy — so every leave application from that page was
 * refused before it reached the database. `startDate` is not a column either; the first day of
 * leave is `leaveDate`, which the table marks NOT NULL.
 *
 * The same page, and the centre admin's approvals screen, then read the decision back from
 * `remarks`, `appliedAt` and `reviewedAt` — none of which exist. The approver's note is stored
 * in `comments` (or `rejectionReason` on a refusal) and the submission time in `requestedAt`,
 * so a rejection reason was saved correctly and never shown to anyone, and every row of the
 * staff member's own leave history read "Applied: Invalid Date".
 */
import { readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repo, p), "utf8");

const ATTENDANCE = "backend/attendance_service/src/main/java/com/lera/attendance_service";
const entity = read(`${ATTENDANCE}/entity/TeacherStaffLeave.java`);
const guard = read(`${ATTENDANCE}/security/AttendanceAuthorizationService.java`);
const staffPage = read("frontend/app/dashboard/staff/attendance/page.tsx");
const approvalsPage = read("frontend/app/dashboard/center-admin/attendance/approvals/page.tsx");

describe("the leave entity is the contract", () => {
  it("names the first day leaveDate, not startDate", () => {
    expect(entity).toMatch(/@Column\(name = "leave_date", nullable = false\)/);
    expect(entity).not.toMatch(/private LocalDate startDate;/);
  });

  it("stores the approver's note as comments / rejectionReason, never remarks", () => {
    expect(entity).toMatch(/private String comments;/);
    expect(entity).toMatch(/private String rejectionReason;/);
    expect(entity).not.toMatch(/private String remarks;/);
  });

  it("times the submission with requestedAt, not appliedAt", () => {
    expect(entity).toMatch(/private LocalDateTime requestedAt/);
    expect(entity).not.toMatch(/private LocalDateTime appliedAt/);
  });

  it("refuses an application with no centerId", () => {
    expect(guard).toMatch(/centerId required on leave/);
  });
});

describe("staff leave application", () => {
  const body = staffPage.slice(
    staffPage.indexOf("/api/leave/apply"),
    staffPage.indexOf("/api/leave/apply") + 900
  );

  it("sends every identity column the guard and the table require", () => {
    for (const field of ["userId", "centerId", "userType", "requestedBy", "leaveDate"]) {
      expect(body).toMatch(new RegExp(`${field}:`));
    }
  });

  it("never posts a startDate the entity would silently drop", () => {
    expect(staffPage).not.toMatch(/startDate:/);
  });

  it("uses the platform's leave-type vocabulary", () => {
    expect(staffPage).toMatch(/"CASUAL_LEAVE"/);
    expect(staffPage).not.toMatch(/value="CASUAL"/);
  });
});

describe("leave decisions are read back from the fields they were written to", () => {
  it("shows the staff member the reason their leave was refused", () => {
    expect(staffPage).toMatch(/leave\.rejectionReason \|\| leave\.comments/);
    expect(staffPage).not.toMatch(/leave\.remarks/);
  });

  it("dates the application from requestedAt on both screens", () => {
    expect(staffPage).toMatch(/leave\.requestedAt/);
    expect(approvalsPage).toMatch(/l\.requestedAt/);
    expect(staffPage).not.toMatch(/leave\.appliedAt/);
  });

  it("maps the approver's note on the approvals screen", () => {
    expect(approvalsPage).toMatch(/l\.rejectionReason : l\.comments/);
  });
});
