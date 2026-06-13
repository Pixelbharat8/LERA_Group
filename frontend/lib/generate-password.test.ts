import { describe, it, expect } from "vitest";
import { generateTempPassword } from "./generate-password";

describe("generateTempPassword", () => {
  it("respects a minimum length and the requested length", () => {
    expect(generateTempPassword(16).length).toBe(16);
    expect(generateTempPassword(8).length).toBe(12); // floored to 12
  });

  it("always includes an upper, lower, digit, and symbol", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateTempPassword();
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[!@#$%^&*]/);
    }
  });

  it("excludes visually ambiguous characters (0 O 1 l I)", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTempPassword()).not.toMatch(/[0O1lI]/);
    }
  });

  it("is not constant (no hardcoded default)", () => {
    const set = new Set(Array.from({ length: 20 }, () => generateTempPassword()));
    expect(set.size).toBe(20);
  });
});
