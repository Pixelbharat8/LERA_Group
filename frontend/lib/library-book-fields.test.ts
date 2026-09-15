import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guards a cross-layer drift, like cms-public-categories.test.ts and service-hostnames.test.ts.
 *
 * `/api/library/books` hand-builds its JSON in LibraryController.toBook, so the response shape is
 * a literal list of m.put("key", ...) calls. The library page declares an interface for that shape
 * and TypeScript checks the page against the *interface* — never against the controller. So the
 * two drifted with nothing to catch it:
 *
 *   - the page read `book.author` and `book.category`; the controller sent `authorId`/`categoryId`,
 *     leaving the author line and the category badge blank on every card, the category filter
 *     permanently empty, and author search unable to match anything;
 *   - the page read `book.available`; the controller sends `isAvailable`, so the truthiness test
 *     saw `undefined` and every book in stock rendered "✗ Hết / Unavailable".
 *
 * None of that throws. The page renders, the request is 200, and the catalogue is simply wrong —
 * which is why it needs a test and not just a fix.
 */

const REPO = path.resolve(__dirname, "..", "..");
const CONTROLLER = path.join(
  REPO, "backend", "academy_service", "src", "main", "java",
  "com", "lera", "academy_service", "controller", "LibraryController.java"
);
const PAGE = path.join(REPO, "frontend", "app", "dashboard", "library", "page.tsx");

/** Every key `/api/library/books` actually puts on a book. */
function apiBookKeys(): Set<string> {
  const src = fs.readFileSync(CONTROLLER, "utf8");
  const body = src.match(/private Map<String, Object> toBook\(Book b, BookNames names\) \{([\s\S]*?)\n    \}/);
  if (!body) throw new Error("toBook(Book, BookNames) not found in LibraryController");
  const keys = new Set(Array.from(body[1].matchAll(/m\.put\("([A-Za-z]+)"/g)).map((m) => m[1]));
  if (keys.size === 0) throw new Error("no m.put keys parsed from toBook");
  return keys;
}

/** The fields the page's Book interface claims the API returns. */
function declaredBookFields(): string[] {
  const src = fs.readFileSync(PAGE, "utf8");
  const iface = src.match(/interface Book \{([\s\S]*?)\n\}/);
  if (!iface) throw new Error("interface Book not found in the library page");
  return Array.from(iface[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\??:/gm)).map((m) => m[1]);
}

describe("library book fields", () => {
  it("every field the page declares is a key the API actually sends", () => {
    const sent = apiBookKeys();
    const missing = declaredBookFields().filter((f) => !sent.has(f));
    expect(
      missing,
      `The library page's Book interface declares ${missing.join(", ")}, which /api/library/books ` +
        `never returns. Keys the API does send: ${Array.from(sent).sort().join(", ")}.`
    ).toEqual([]);
  });

  it("sends resolved display names, not only the ids they came from", () => {
    const sent = apiBookKeys();
    // The page shows an author line and a category badge; ids alone render blanks.
    for (const name of ["author", "category", "publisher"]) {
      expect(sent.has(name), `toBook must resolve "${name}", not just "${name}Id"`).toBe(true);
    }
  });
});
