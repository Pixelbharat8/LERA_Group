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
});
