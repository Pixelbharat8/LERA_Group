import { describe, it, expect } from "vitest";
import { apiUrl } from "./api";

// NEXT_PUBLIC_API_BASE_URL is unset in the test env, so apiUrl returns same-origin
// paths. The branches that matter regardless of base URL: absolute pass-through and
// leading-slash normalization.
describe("apiUrl", () => {
  it("passes absolute http(s) URLs through unchanged", () => {
    expect(apiUrl("https://cdn.example.com/x.png")).toBe("https://cdn.example.com/x.png");
    expect(apiUrl("http://localhost:8086/api/chat")).toBe("http://localhost:8086/api/chat");
  });

  it("prefixes a leading slash on relative paths", () => {
    expect(apiUrl("api/leads")).toBe("/api/leads");
  });

  it("leaves an already-rooted path intact", () => {
    expect(apiUrl("/api/leads?centerId=c1")).toBe("/api/leads?centerId=c1");
  });
});
