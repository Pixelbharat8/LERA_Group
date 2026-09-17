import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards a cross-layer drift, like library-book-fields.test.ts and service-hostnames.test.ts.
 *
 * A payroll record is stored as a pay PERIOD — payPeriodStart / payPeriodEnd. It has never had a
 * month or a year field. Several pages read `record.month` and `record.year` anyway, and because
 * both come back undefined the period rendered as "undefined undefined" — including in the
 * <title> and the body of the payslip document itself, which is the thing an employee is handed.
 *
 * `months[record.month - 1]` is the sharp edge: undefined - 1 is NaN, months[NaN] is undefined,
 * and nothing throws. The payslip prints, with no period on it.
 */

const REPO = path.resolve(__dirname, "..", "..");
const ENTITY = path.join(
  REPO, "backend", "payroll_service", "src", "main", "java",
  "com", "lera", "payroll_service", "entity", "PayrollRecord.java"
);
const DASHBOARD = path.join(REPO, "frontend", "app", "dashboard");

function entityFields(): Set<string> {
  const src = fs.readFileSync(ENTITY, "utf8");
  const fields = new Set(
    Array.from(src.matchAll(/private\s+[A-Za-z0-9_<>,.]+\s+([a-zA-Z_][A-Za-z0-9_]*)\s*[;=]/g)).map((m) => m[1])
  );
  if (fields.size === 0) throw new Error("no fields parsed from PayrollRecord");
  return fields;
}

function pagesReadingPayrollPeriod(): { file: string; hits: string[] }[] {
  const found: { file: string; hits: string[] }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules") continue;
        walk(full);
        continue;
      }
      if (!e.name.endsWith(".tsx")) continue;
      const src = fs.readFileSync(full, "utf8");
      // only pages that actually deal with payroll records
      if (!/payroll|payslip|Payslip/i.test(src)) continue;
      const hits: string[] = [];
      // A use guarded by an explicit `typeof x.month === "number"` is a deliberate fallback for a
      // caller that might supply one; it is the UNGUARDED reads that print "undefined undefined".
      const guarded = (v: string) =>
        new RegExp(`typeof\\s+${v}\\.month\\s*===\\s*["']number["']`).test(src);
      for (const m of src.matchAll(/months\[\s*(\w+)\.month\s*-\s*1\s*\]/g)) {
        if (!guarded(m[1])) hits.push(m[0]);
      }
      for (const m of src.matchAll(/\{\s*(\w+)\.month\s*\}\s*\/\s*\{\s*\1\.year\s*\}/g)) {
        if (!guarded(m[1])) hits.push(m[0]);
      }
      if (hits.length) found.push({ file: path.relative(DASHBOARD, full), hits });
    }
  };
  walk(DASHBOARD);
  return found;
}

describe("payroll period fields", () => {
  it("a payroll record is a period, not a month and a year", () => {
    const fields = entityFields();
    expect(fields.has("payPeriodStart"), "PayrollRecord should carry payPeriodStart").toBe(true);
    expect(fields.has("payPeriodEnd"), "PayrollRecord should carry payPeriodEnd").toBe(true);
    expect(
      fields.has("month") || fields.has("year"),
      "PayrollRecord gained month/year — the pages' fallbacks can be simplified, and this test updated"
    ).toBe(false);
  });

  it("no page renders a payroll period straight from .month / .year", () => {
    const offenders = pagesReadingPayrollPeriod();
    expect(
      offenders,
      offenders.length
        ? `These render a payroll period from fields the record does not have, which prints ` +
          `"undefined undefined" (months[undefined - 1] is undefined, and nothing throws):\n` +
          offenders.map((o) => `  ${o.file}: ${o.hits.join(", ")}`).join("\n")
        : ""
    ).toEqual([]);
  });
});
