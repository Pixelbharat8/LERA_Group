import { describe, it, expect } from "vitest";
import { buildCenterFilterUrl } from "./center-filter";

describe("buildCenterFilterUrl", () => {
  it("returns the base URL unchanged when no centerId", () => {
    expect(buildCenterFilterUrl("/api/leads", null)).toBe("/api/leads");
  });

  it("appends centerId with ? when the URL has no query string", () => {
    expect(buildCenterFilterUrl("/api/leads", "c1")).toBe("/api/leads?centerId=c1");
  });

  it("appends centerId with & when the URL already has a query string", () => {
    // This is the case the renewals 'generate' call relies on.
    expect(buildCenterFilterUrl("/api/renewals/generate?daysAhead=30", "c1")).toBe(
      "/api/renewals/generate?daysAhead=30&centerId=c1"
    );
  });

  it("URL-encodes the centerId", () => {
    expect(buildCenterFilterUrl("/api/leads", "a b/c")).toBe("/api/leads?centerId=a%20b%2Fc");
  });
});
