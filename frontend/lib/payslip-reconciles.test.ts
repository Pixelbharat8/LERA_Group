import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards a cross-layer drift, like payroll-period-fields.test.ts.
 *
 * A payslip's whole job is to explain how the net figure was arrived at. The net is computed in
 * PayrollGenerationService as:
 *
 *     baseSalary + teachingAmount + bonus + overtime - deductions
 *
 * The printed payslip itemised Base Salary, Overtime Pay, Bonus and Deductions and then printed
 * the net — but it read `record.overtimePay`, which is not a field (the amount is `overtime`), so
 * the overtime row never appeared; and it never mentioned teachingAmount at all. The lines
 * therefore did not add up to the total on the same page, and for a teacher paid mostly on
 * teaching hours the largest single component of their pay was missing from the document.
 *
 * This asserts the payslip template names every component of the formula, so a component added to
 * the calculation cannot silently go unexplained on the payslip.
 */

const REPO = path.resolve(__dirname, "..", "..");
const GENERATOR = path.join(
  REPO, "backend", "payroll_service", "src", "main", "java",
  "com", "lera", "payroll_service", "service", "PayrollGenerationService.java"
);
const PAYSLIP_PAGE = path.join(
  REPO, "frontend", "app", "dashboard", "superadmin", "payroll", "page.tsx"
);

/** The components the backend actually sums to reach totalAmount. */
function formulaComponents(): string[] {
  const src = fs.readFileSync(GENERATOR, "utf8");
  const line = src.match(/BigDecimal\s+totalAmount\s*=\s*([^;]+);/);
  if (!line) throw new Error("totalAmount formula not found in PayrollGenerationService");
  const names = Array.from(line[1].matchAll(/\b([a-z][A-Za-z0-9]*)\b/g))
    .map((m) => m[1])
    .filter((n) => !["add", "subtract", "multiply", "BigDecimal", "ZERO"].includes(n));
  const unique = Array.from(new Set(names));
  if (unique.length < 3) throw new Error(`parsed too few components: ${unique.join(",")}`);
  return unique;
}

describe("payslip reconciles with the payroll formula", () => {
  it("the printed payslip names every component of the net", () => {
    const page = fs.readFileSync(PAYSLIP_PAGE, "utf8");
    // the payslip document is built in the print template; check the whole page, since a
    // component may legitimately be rendered via a helper
    const missing = formulaComponents().filter(
      (c) => !new RegExp(`record\\??\\.${c}\\b`).test(page)
    );
    expect(
      missing,
      missing.length
        ? `The payslip never shows ${missing.join(", ")}, but the net is computed from ` +
          `${formulaComponents().join(" / ")}. The itemised lines will not add up to the total ` +
          `printed beneath them.`
        : ""
    ).toEqual([]);
  });
});
