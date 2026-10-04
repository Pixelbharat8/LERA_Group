import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  PRIVACY_SECTIONS_EN,
  PRIVACY_SECTIONS_VI,
  TERMS_SECTIONS_EN,
  TERMS_SECTIONS_VI,
} from "./legal-content";

/**
 * The privacy policy and the terms of service were written twice: the public pages carried the
 * real documents, and each admin editor seeded its own shorter draft. Opening an editor and
 * pressing Save published the draft — and the draft was missing whole sections of the live
 * document. Privacy lost "Scope & Legal Basis" (which cites Vietnam's Personal Data Protection
 * Decree) and "Children's Data & Parental Consent"; terms lost "Limitation of Liability" and
 * "AI Tutor Usage".
 *
 * Nothing in the UI showed that happening, which is why this is a test and not just a fix.
 */

const REPO = path.resolve(__dirname, "..", "..");
const FE = path.join(REPO, "frontend", "app");

const PAGES = [
  ["public privacy", path.join(FE, "privacy", "page.tsx")],
  ["public terms", path.join(FE, "terms", "page.tsx")],
  ["privacy editor", path.join(FE, "dashboard", "superadmin", "public-website", "privacy", "page.tsx")],
  ["terms editor", path.join(FE, "dashboard", "superadmin", "public-website", "terms", "page.tsx")],
] as const;

describe("legal content has one source", () => {
  it.each(PAGES)("%s reads the shared wording and defines none of its own", (_label, file) => {
    const src = fs.readFileSync(file, "utf8");
    expect(src.includes('from "../../lib/legal-content"') || src.includes("lib/legal-content")).toBe(true);
    // a second copy of the document inside the page is exactly what drifted before
    expect(
      /const\s+defaultSections(EN|VI)\s*[:=]/.test(src),
      "This page defines its own copy of the legal text again — that is how the editor and the " +
        "public page came to publish different documents."
    ).toBe(false);
  });

  it("keeps the sections that carry legal weight", () => {
    const privacyTitles = PRIVACY_SECTIONS_EN.map((s) => s.title).join(" | ");
    expect(privacyTitles, "the legal basis for processing must be stated").toMatch(/Legal Basis/i);
    expect(privacyTitles, "LERA teaches children; parental consent must be covered").toMatch(/Children|Parental/i);

    const legalBasis = PRIVACY_SECTIONS_EN.find((s) => /Legal Basis/i.test(s.title));
    expect(
      legalBasis?.content,
      "the Vietnamese decree this policy relies on should be cited by name"
    ).toMatch(/13\/2023/);

    const termsTitles = TERMS_SECTIONS_EN.map((s) => s.title).join(" | ");
    expect(termsTitles).toMatch(/Limitation of Liability/i);
  });

  it("says the same thing in both languages", () => {
    expect(PRIVACY_SECTIONS_VI.length).toBe(PRIVACY_SECTIONS_EN.length);
    expect(TERMS_SECTIONS_VI.length).toBe(TERMS_SECTIONS_EN.length);
    for (const s of [...PRIVACY_SECTIONS_VI, ...TERMS_SECTIONS_VI]) {
      expect(s.content.trim().length, `"${s.title}" has no Vietnamese text`).toBeGreaterThan(0);
    }
  });

  /**
   * These tie the document to the code rather than to a reviewer's memory. ai_gateway posts to
   * api.anthropic.com / api.openai.com, which is a transfer of personal data out of Vietnam and
   * a disclosure obligation under Nghị định 13/2023/NĐ-CP. Neither document mentioned it. If the
   * integration is ever removed these tests should be removed with it — but while the calls are
   * in the source, the policy has to say so.
   */
  it("discloses the AI cross-border transfer for as long as the code makes those calls", () => {
    const aiSrc = path.join(REPO, "backend/ai_gateway/src/main/java");
    const calls: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith(".java")) {
          const src = fs.readFileSync(full, "utf8");
          if (src.includes("api.anthropic.com")) calls.push("Anthropic");
          if (src.includes("api.openai.com")) calls.push("OpenAI");
        }
      }
    };
    walk(aiSrc);
    if (calls.length === 0) return; // integration gone; the disclosure may go too

    const privacy = PRIVACY_SECTIONS_EN.map((s) => `${s.title} ${s.content}`).join("\n");
    const privacyVi = PRIVACY_SECTIONS_VI.map((s) => `${s.title} ${s.content}`).join("\n");
    for (const provider of Array.from(new Set(calls))) {
      expect(privacy, `${provider} receives personal data and must be named`).toContain(provider);
      expect(privacyVi, `${provider} must be named in the Vietnamese policy too`).toContain(provider);
    }
    expect(privacy, "the transfer must be described as leaving Vietnam").toMatch(/outside Vietnam/i);
    expect(privacyVi).toMatch(/ngoài Việt Nam/i);
    expect(
      TERMS_SECTIONS_EN.map((s) => s.content).join("\n"),
      "the AI terms must repeat the transfer, since that is where consent to use the tutor is given"
    ).toMatch(/Anthropic|OpenAI/);
  });

  it("covers staff data while the platform holds payroll", () => {
    // The policy was written for learners and parents only, yet the platform stores salaries,
    // payslips, leave and employment documents. Staff are data subjects under the same decree.
    const payrollEntities = path.join(REPO, "backend/payroll_service/src/main/java");
    if (!fs.existsSync(payrollEntities)) return;
    const titles = PRIVACY_SECTIONS_EN.map((s) => s.title).join(" | ");
    expect(titles, "payroll exists, so employee data must be disclosed").toMatch(/Staff|Employee/i);
    expect(PRIVACY_SECTIONS_VI.map((s) => s.title).join(" | ")).toMatch(/Nhân Viên/i);
  });

  it("numbers its sections consecutively from 1", () => {
    // Two sections were inserted; a stale "see section 7" reference is a document that
    // contradicts itself.
    for (const [label, sections] of [
      ["privacy EN", PRIVACY_SECTIONS_EN], ["privacy VI", PRIVACY_SECTIONS_VI],
      ["terms EN", TERMS_SECTIONS_EN], ["terms VI", TERMS_SECTIONS_VI],
    ] as const) {
      const numbers = sections.map((s) => Number(s.title.match(/^(\d+)\./)?.[1]));
      expect(numbers, `${label} has an unnumbered section`).not.toContain(NaN);
      expect(numbers, `${label} is misnumbered`).toEqual(numbers.map((_, i) => i + 1));
    }
  });
});
