/**
 * An activity_logs row identifies its actor only by user_id. The audit screen rendered
 * `log.userEmail || log.userId`, so with no email on the row every entry in the trail named
 * its actor with a raw UUID — and the search box, which filtered on userEmail alone, could
 * never match a single row.
 *
 * The listing endpoints now resolve the actor. The batching assertion matters: the tenant
 * endpoint returns a Page, and the obvious `Page.map()` enrichment issues one user lookup per
 * row.
 */
import { readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repo, p), "utf8");

const IDENTITY = "backend/identity_service/src/main/java/com/lera/identity_service";
const entity = read(`${IDENTITY}/entity/ActivityLog.java`);
const controller = read(`${IDENTITY}/controller/ActivityLogController.java`);
const page = read("frontend/app/dashboard/superadmin/audit/page.tsx");

describe("audit trail actors", () => {
  it("the log row stores a UUID and nothing else about the actor", () => {
    expect(entity).toMatch(/private UUID userId;/);
    expect(entity).not.toMatch(/private String (userEmail|userName);/);
  });

  it("every cross-user listing resolves the actor", () => {
    for (const endpoint of ["getActivitiesByDateRange", "getActivitiesByType", "getTenantActivities"]) {
      const body = controller.slice(controller.indexOf(endpoint));
      expect(body.slice(0, 600)).toMatch(/withActors\(/);
    }
    expect(controller).toMatch(/row\.put\("userEmail"/);
    expect(controller).toMatch(/row\.put\("userName"/);
  });

  it("resolves a whole page in one lookup, not one query per row", () => {
    expect(controller).toMatch(/userRepository\.findAllById\(userIds\)/);
    expect(controller).not.toMatch(/activities\.map\(a -> withActors/);
  });

  it("search reaches the actor, not just the description", () => {
    expect(page).toMatch(/log\.userEmail, log\.userName/);
  });

  it("falls back to a truncated id rather than a bare UUID column", () => {
    expect(page).not.toMatch(/\{log\.userEmail \|\| log\.userId\}/);
    expect(page).toMatch(/userId\.slice\(0, 8\)/);
  });
});
