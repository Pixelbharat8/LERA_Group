import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api";
import { computeAttendanceRate } from "./student-context";

vi.mock("./api", () => ({ apiFetch: vi.fn() }));
const apiFetch = vi.mocked(api.apiFetch);

// Route apiFetch by URL fragment; an Error value rejects (to exercise catch paths).
function route(map: Record<string, unknown>) {
  apiFetch.mockImplementation((url: string) => {
    for (const [frag, val] of Object.entries(map)) {
      if (url.includes(frag)) {
        return val instanceof Error ? Promise.reject(val) : Promise.resolve(val);
      }
    }
    return Promise.resolve([]);
  });
}

describe("computeAttendanceRate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses LMS session marks first (PRESENT/LATE count as attended)", async () => {
    route({
      "session-attendance": [{ status: "PRESENT" }, { status: "LATE" }, { status: "ABSENT" }],
    });
    expect(await computeAttendanceRate("s1")).toBe(67); // 2/3
  });

  it("falls back to the stats endpoint's attendanceRate", async () => {
    route({ "session-attendance": [], "/stats": { attendanceRate: 85 } });
    expect(await computeAttendanceRate("s1")).toBe(85);
  });

  it("derives a rate from stats present/total when no direct rate", async () => {
    route({ "session-attendance": [], "/stats": { present: 3, total: 4 } });
    expect(await computeAttendanceRate("s1")).toBe(75);
  });

  it("falls through to the raw attendance list when stats errors", async () => {
    route({
      "session-attendance": [],
      "/stats": new Error("500"),
      "attendance?": [{ status: "PRESENT" }, { status: "ABSENT" }],
    });
    expect(await computeAttendanceRate("s1")).toBe(50);
  });

  it("returns 0 when there is no attendance data anywhere", async () => {
    route({ "session-attendance": [], "/stats": {}, "attendance?": [] });
    expect(await computeAttendanceRate("s1")).toBe(0);
  });
});
