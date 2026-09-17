/**
 * The superadmin approvals screen was dead in three independent ways, each of which alone
 * hid every public registration from the people who have to approve it:
 *
 *  1. registration wrote status='PENDING' but never approval_status, while the query the
 *     screen calls filtered on approval_status = 'PENDING' -> always zero rows;
 *  2. UserDTO carried no approvalStatus at all, so the client-side filter could not match;
 *  3. POST /api/users/{id}/approve ignored its body, so the "Assign Role" select was
 *     discarded while the UI still announced "User approved as <role>".
 *
 * These assertions read the real sources, so re-introducing any of the three fails here.
 */
import { readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repo, p), "utf8");

const IDENTITY = "backend/identity_service/src/main/java/com/lera/identity_service";
const dto = read(`${IDENTITY}/dto/UserDTO.java`);
const service = read(`${IDENTITY}/service/UserService.java`);
const repository = read(`${IDENTITY}/repository/UserRepository.java`);
const controller = read(`${IDENTITY}/controller/UserController.java`);
const page = read("frontend/app/dashboard/superadmin/approvals/page.tsx");

describe("user registration approval workflow", () => {
  it("returns approvalStatus to the client that filters on it", () => {
    expect(dto).toMatch(/private String approvalStatus;/);
    expect(service).toMatch(/\.approvalStatus\(user\.getApprovalStatus\(\)\)/);
  });

  it("stamps approval_status at registration so the pending queue is queryable", () => {
    expect(service).toMatch(/\.approvalStatus\("PENDING"\.equals\(userStatus\)/);
    expect(service).toMatch(/\.requestedAt\("PENDING"\.equals\(userStatus\)/);
  });

  it("still finds accounts registered before approval_status was stamped", () => {
    expect(repository).toMatch(
      /u\.approvalStatus IS NULL AND u\.status = 'PENDING'/
    );
    expect(service).toMatch(/findAwaitingApprovalWithRelations\(\)/);
  });

  it("applies the role the approver picked instead of dropping it", () => {
    expect(controller).toMatch(/body\.get\("roleName"\)/);
    expect(controller).toMatch(/setApprovalStatus\(id, "APPROVED", approverId, null, assignedRole\)/);
    expect(service).toMatch(/user\.setRoleId\(assigned\.getId\(\)\)/);
  });

  it("refuses to let a centre-scoped approver assign a role", () => {
    const approve = controller.slice(controller.indexOf("approveUser"));
    expect(approve).toMatch(/!SecurityUtils\.isOrgWide\(actor\)/);
  });

  it("reads only fields the API actually returns", () => {
    expect(page).not.toMatch(/requestedRole/);
    expect(page).not.toMatch(/requestedByName/);
    expect(page).toMatch(/u\.status === "PENDING"/);
  });
});
