import { describe, it, expect } from "vitest";
import { scopedListUrl } from "./center-scoped-list";

describe("scopedListUrl", () => {
  it("appends the centerId when the scope says to filter", () => {
    expect(scopedListUrl("/api/students", { centerId: "c1", shouldFilterByCenter: true })).toBe(
      "/api/students?centerId=c1"
    );
  });

  it("omits the centerId for org-wide scope (shouldFilterByCenter false)", () => {
    expect(scopedListUrl("/api/students", { centerId: "c1", shouldFilterByCenter: false })).toBe(
      "/api/students"
    );
  });

  it("leaves the URL unchanged when filtering is on but there is no centerId", () => {
    expect(scopedListUrl("/api/students", { centerId: null, shouldFilterByCenter: true })).toBe(
      "/api/students"
    );
  });
});
