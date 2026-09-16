import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards a cross-layer drift, like route-parity.test.ts and service-hostnames.test.ts.
 *
 * Editable page content lives in cms_settings, grouped by category. A logged-out visitor may read
 * only the categories listed in CmsSettingController.PUBLIC_CATEGORIES; anything else returns 403.
 * A public page therefore needs its category in that list, and nothing in the codebase connected
 * the two — so `scholarships` shipped as a CMS-editable page whose category was never allowlisted.
 *
 * The failure was quiet, which is what makes it worth a test: the fetch 403'd, the page fell back
 * to its hardcoded bilingual defaults, and it looked fine. What broke was invisible — anything
 * staff edited under Chairman → Website Content → Scholarships never reached the site.
 */

const REPO = path.resolve(__dirname, "..", "..");
const CONTROLLER = path.join(
  REPO, "backend", "academy_service", "src", "main", "java",
  "com", "lera", "academy_service", "controller", "CmsSettingController.java"
);
const APP = path.join(REPO, "frontend", "app");

/** The categories the backend serves to anonymous callers. */
function allowlist(): Set<string> {
  const src = fs.readFileSync(CONTROLLER, "utf8");
  const decl = src.match(/PUBLIC_CATEGORIES\s*=\s*java\.util\.Set\.of\(([\s\S]*?)\);/);
  if (!decl) throw new Error("PUBLIC_CATEGORIES not found in CmsSettingController");
  return new Set(Array.from(decl[1].matchAll(/"([a-z_]+)"/g)).map((m) => m[1]));
}

/** Categories requested from pages a logged-out visitor can reach (i.e. outside /dashboard). */
function publicCategories(): Map<string, string> {
  const found = new Map<string, string>();
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "dashboard" || e.name === "admin" || e.name === "node_modules") continue;
        walk(full);
      } else if (e.name.endsWith(".tsx")) {
        const src = fs.readFileSync(full, "utf8");
        // Two idioms reach the same API, and checking only the first left the pages that use
        // the second — privacy, terms, homepage, contact, header, about — unchecked entirely.
        for (const m of src.matchAll(/usePageContent\("([a-z_]+)"\)/g)) {
          found.set(m[1], path.relative(APP, full));
        }
        for (const m of src.matchAll(/cms-settings\/map\/([a-z_]+)/g)) {
          found.set(m[1], path.relative(APP, full));
        }
        for (const m of src.matchAll(/cms-settings\/map\/([a-z_]+)/g)) {
          found.set(m[1], path.relative(APP, full));
        }
      }
    }
  };
  walk(APP);
  return found;
}

describe("public CMS categories", () => {
  it("every category a public page asks for is readable without logging in", () => {
    const allowed = allowlist();
    const missing = Array.from(publicCategories().entries())
      .filter(([cat]) => !allowed.has(cat))
      .map(([cat, file]) => `  - "${cat}" requested by app/${file}`);

    expect(
      missing,
      `\nA public page requests a CMS category that CmsSettingController will not serve\n` +
        `anonymously, so the fetch 403s and the page silently shows its hardcoded defaults —\n` +
        `whatever staff edit for that page never appears on the site.\n` +
        `Add the category to PUBLIC_CATEGORIES in CmsSettingController.java.\n\n` +
        missing.join("\n") + "\n"
    ).toEqual([]);
  });
});
