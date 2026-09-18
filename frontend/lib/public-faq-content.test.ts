import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The public contact page's FAQ accordion was rendering six blank rows.
 *
 * The Faq entity's columns are question / answer (both NOT NULL) plus optional questionVI /
 * answerVI. The public page declared questionEN / answerEN — names the API has never emitted —
 * and the fetch only replaces the built-in defaults when it returns rows, so the moment any FAQ
 * existed the accordion switched to rendering `undefined` in English and a null questionVI in
 * Vietnamese. Measured against the running API: /api/faqs/page/contact returns 6 rows, the keys
 * are question/answer, and questionVI is null on all of them.
 *
 * The same mismatch in the contact-page editor meant its POST arrived with both NOT NULL
 * columns null, so no FAQ could be created there at all — while a second editor at
 * public-website/faq used the right names and worked. (Third instance of two editors for one
 * piece of public content, one of them broken.)
 *
 * The page also shipped six hardcoded FAQs as a fallback — a refund policy, a free-trial
 * promise, and a claim about every teacher's nationality and certification. Public commitments
 * nobody at LERA wrote. Removed; the accordion now shows only published content.
 */

const REPO = path.resolve(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");
/** Assertions are about the code, not the comments that explain why the code is that way. */
const code = (p: string) =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const entity = read("backend/academy_service/src/main/java/com/lera/academy_service/entity/Faq.java");
const publicPage = code("frontend/app/contact/page.tsx");
const contactEditor = code("frontend/app/dashboard/superadmin/public-website/contact/page.tsx");
const faqEditor = code("frontend/app/dashboard/superadmin/public-website/faq/page.tsx");

describe("the Faq entity is the contract", () => {
  it("requires question and answer, and treats the VI pair as optional", () => {
    expect(entity).toMatch(/@Column\(name = "question", nullable = false/);
    expect(entity).toMatch(/@Column\(name = "answer", nullable = false/);
    expect(entity).not.toMatch(/questionEN|answerEN/);
  });
});

describe("every surface that touches an FAQ uses those names", () => {
  it.each([
    ["the public contact page", () => publicPage],
    ["the contact-page editor", () => contactEditor],
    ["the FAQ editor", () => faqEditor],
  ])("%s", (_label, src) => {
    expect(src()).not.toMatch(/questionEN|answerEN/);
  });

  it("the public page reads question/answer and falls back when VI is absent", () => {
    expect(publicPage).toMatch(/faq\.questionVI \|\| faq\.question/);
    expect(publicPage).toMatch(/faq\.answerVI \|\| faq\.answer/);
  });
});

describe("the empty state", () => {
  it("hides the whole FAQ section rather than heading an empty space", () => {
    expect(publicPage).toMatch(/\{faqs\.length > 0 && \(/);
  });
});

describe("no invented public commitments ship in the bundle", () => {
  it("has no hardcoded FAQ content", () => {
    expect(publicPage).toMatch(/const defaultFaqs: FaqItem\[\] = \[\];/);
  });

  it.each([
    "refund",
    "native English speakers",
    "CELTA",
    "free trial class for all new students",
  ])("does not promise %s", (claim) => {
    expect(publicPage.toLowerCase()).not.toContain(claim.toLowerCase());
  });
});
