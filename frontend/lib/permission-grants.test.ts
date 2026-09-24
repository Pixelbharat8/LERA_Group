import { describe, it, expect } from "vitest";
import {
  mapApiPermissions,
  grantsModule,
  DEFAULT_PERMISSIONS,
  type UserPermission,
} from "../app/context/PermissionContext";

/**
 * GET /api/user-permissions/user/{id} answers 200 for everyone: a real row when one exists,
 * otherwise a synthesised all-denied default. The client used to tell them apart by asking
 * whether ANY flag was true — but the synthesised default always carries `dashboard: true`,
 * so every logged-in user matched, the 15-role defaults table was unreachable, and a
 * Chairman who switched every module off had the revocation ignored.
 */
describe("mapApiPermissions reports whether a stored row backs the response", () => {
  it("does not treat the server's synthesised default as a configured grant", () => {
    const synthesised = {
      userId: "u1",
      configured: false,
      dashboard: true, // always true here — the old "any flag is true" test matched on this
      students: false,
      payroll: false,
    };
    const result = mapApiPermissions(synthesised);
    expect(result?.configured).toBe(false);
  });

  it("treats a stored row as configured even when every module is switched off", () => {
    const revokedEverything = {
      id: "row-1",
      userId: "u1",
      configured: true,
      dashboard: false,
      students: false,
      payroll: false,
    };
    const result = mapApiPermissions(revokedEverything);
    expect(result?.configured).toBe(true);
    expect(result?.permissions.students).toBe(false);
  });

  it("falls back to the row id when the server predates the configured flag", () => {
    expect(mapApiPermissions({ id: "row-1", userId: "u1", students: true })?.configured).toBe(true);
    expect(mapApiPermissions({ userId: "u1", dashboard: true })?.configured).toBe(false);
  });

  it("reads the API's aiAssistant key into the ai_assistant flag the sidebar checks", () => {
    // layout.tsx asked for `aiAssistant`, a key this shape has never carried, behind an
    // `as any` that silenced the type error — so the entry could never appear.
    const result = mapApiPermissions({ id: "row-1", userId: "u1", aiAssistant: true });
    expect(result?.permissions.ai_assistant).toBe(true);
  });

  it("returns null for a body that is not an object", () => {
    expect(mapApiPermissions(null)).toBeNull();
    expect(mapApiPermissions("nope")).toBeNull();
  });
});

describe("grantsModule opens a sidebar section only on a per-user grant", () => {
  const withStudents: UserPermission = { ...DEFAULT_PERMISSIONS, students: true };

  it("is true when an admin saved a row turning the module on", () => {
    expect(grantsModule("grant", withStudents, "students")).toBe(true);
  });

  it("is false when the flag only comes from the role's defaults", () => {
    // A TEACHER's role default sets students: true. That is not somebody deciding this
    // user may see Academy Management, so it must not reveal the section.
    expect(grantsModule("role", withStudents, "students")).toBe(false);
    expect(grantsModule("default", withStudents, "students")).toBe(false);
  });

  it("is false for a module the grant does not include", () => {
    expect(grantsModule("grant", withStudents, "payroll")).toBe(false);
  });
});
