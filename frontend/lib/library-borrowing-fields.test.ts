/**
 * GET /api/library/borrowed returned raw BookBorrowing rows, which carry only a bookId.
 * The borrowed-books list therefore rendered an empty title on every row. Its status is also
 * stored uppercase (BORROWED / RETURNED / OVERDUE / LOST) while the page compared against
 * "overdue", so the overdue badge could never appear.
 */
import { readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repo, p), "utf8");

const ACADEMY = "backend/academy_service/src/main/java/com/lera/academy_service";
const entity = read(`${ACADEMY}/entity/BookBorrowing.java`);
const controller = read(`${ACADEMY}/controller/LibraryController.java`);
const page = read("frontend/app/dashboard/library/page.tsx");

describe("borrowed books", () => {
  it("the row itself carries no title — only a bookId", () => {
    expect(entity).toMatch(/private UUID bookId;/);
    expect(entity).not.toMatch(/private String (bookTitle|title);/);
  });

  it("the endpoint resolves titles before returning", () => {
    expect(controller).toMatch(/withBookTitles\(/);
    expect(controller).toMatch(/row\.put\("bookTitle"/);
  });

  it("resolves them in one query, not one per row", () => {
    const helper = controller.slice(controller.indexOf("private List<Map<String, Object>> withBookTitles"));
    expect(helper).toMatch(/bookRepository\.findAllById\(bookIds\)/);
    expect(helper).not.toMatch(/for \(.*\) \{[\s\S]{0,400}bookRepository\.findById/);
  });

  it("compares status case-insensitively against the stored uppercase value", () => {
    expect(entity).toMatch(/BORROWED, RETURNED, OVERDUE, LOST/);
    expect(page).toMatch(/String\(b\.status\)\.toUpperCase\(\) === "OVERDUE"/);
    expect(page).not.toMatch(/status === ['"]overdue['"]/);
  });
});
