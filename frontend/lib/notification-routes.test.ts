/**
 * Clicking a notification pushes a route. Nothing checked those routes existed, and six of
 * them didn't: student/exams, student/certificates, student/transport, staff/leave,
 * staff/lesson-plans and staff/curriculum had no page, and the student/teacher detail routes
 * pointed at /dashboard/superadmin/... which only has the list. Those notifications opened a
 * 404. The handler also branched on `link`, `category` and `conversationId`, none of which the
 * Notification entity has, so the fallbacks behind those branches were unreachable.
 *
 * This walks every literal route in the handler and asserts a page file exists for it.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const dashboard = join(repo, "frontend/app/dashboard");
const page = readFileSync(join(dashboard, "notifications/page.tsx"), "utf8");

// Only the route table, not the rest of the file.
const handler = page.slice(
  page.indexOf("const refRoutes"),
  page.indexOf("const markAllAsRead")
);

const routeExists = (route: string) => {
  const rel = route.replace(/^\/dashboard\//, "").replace(/\/$/, "");
  return existsSync(join(dashboard, rel, "page.tsx"));
};

describe("notification click targets", () => {
  const literals = Array.from(
    new Set((handler.match(/"\/dashboard\/[a-z0-9/_-]+"/g) || []).map((m) => m.slice(1, -1)))
  );

  it("has routes to check", () => {
    expect(literals.length).toBeGreaterThan(15);
  });

  it.each(literals)("%s exists", (route) => {
    expect(routeExists(route)).toBe(true);
  });

  it("templated detail routes point at the pages that have an [id] segment", () => {
    expect(handler).toMatch(/\/dashboard\/academy\/students\/\$\{ref\}/);
    expect(handler).toMatch(/\/dashboard\/academy\/teachers\/\$\{ref\}/);
    expect(existsSync(join(dashboard, "academy/students/[id]/page.tsx"))).toBe(true);
    expect(existsSync(join(dashboard, "academy/teachers/[id]/page.tsx"))).toBe(true);
  });

  it("routes the reference types the backend actually emits", () => {
    for (const ref of ["schedule", "attendance", "payment", "leave", "message", "exam"]) {
      expect(handler).toMatch(new RegExp(`\\b${ref}:`));
    }
  });

  it("does not branch on fields the Notification entity lacks", () => {
    const entity = readFileSync(
      join(repo, "backend/connect_service/src/main/java/com/lera/connect_service/entity/Notification.java"),
      "utf8"
    );
    for (const field of ["link", "category", "conversationId"]) {
      expect(entity).not.toMatch(new RegExp(`private \\w+ ${field};`));
      expect(page).not.toMatch(new RegExp(`notification\\.${field}`));
    }
  });
});
