import { describe, it, expect } from "vitest";
import { formatClassSchedule, isClassActive } from "./teacher-context";

describe("formatClassSchedule", () => {
  it("prefers an explicit schedule string", () => {
    expect(formatClassSchedule({ schedule: "Mon/Wed 6pm" })).toBe("Mon/Wed 6pm");
  });

  it("composes days + start–end from parts, trimming seconds", () => {
    expect(
      formatClassSchedule({ scheduleDays: "Mon,Wed", scheduleTimeStart: "18:00:00", scheduleTimeEnd: "19:30:00" })
    ).toBe("Mon,Wed 18:00–19:30");
  });

  it("falls back to just days when times are absent", () => {
    expect(formatClassSchedule({ scheduleDays: "Tue,Thu" })).toBe("Tue,Thu");
  });

  it("returns a TBD placeholder when nothing is set", () => {
    expect(formatClassSchedule({})).toBe("Schedule TBD");
  });
});

describe("isClassActive", () => {
  it("treats OPEN and ACTIVE as active", () => {
    expect(isClassActive("OPEN")).toBe(true);
    expect(isClassActive("ACTIVE")).toBe(true);
  });
  it("treats anything else as inactive", () => {
    expect(isClassActive("CLOSED")).toBe(false);
    expect(isClassActive("COMPLETED")).toBe(false);
    expect(isClassActive("")).toBe(false);
  });
});
