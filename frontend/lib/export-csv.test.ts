import { describe, it, expect } from "vitest";
import { toCsv, type CsvColumn } from "./export-csv";

type Row = { name: string; age: number; note?: string };

const cols: CsvColumn<Row>[] = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: (r) => (r.note ? r.note.toUpperCase() : ""), label: "Note" },
];

describe("toCsv", () => {
  it("emits a header row from the labels", () => {
    expect(toCsv([], cols)).toBe("Name,Age,Note");
  });

  it("maps rows by key and by accessor function", () => {
    const csv = toCsv([{ name: "Anna", age: 7, note: "ok" }], cols);
    expect(csv).toBe("Name,Age,Note\nAnna,7,OK");
  });

  it("quotes and escapes commas, quotes, and newlines", () => {
    const csv = toCsv([{ name: 'Smith, "AJ"', age: 9, note: "a\nb" }], cols);
    // the Note column accessor upper-cases → "A\nB"
    expect(csv).toBe('Name,Age,Note\n"Smith, ""AJ""",9,"A\nB"');
  });

  it("renders null/undefined as empty cells", () => {
    const csv = toCsv([{ name: "X", age: 0 }], cols);
    expect(csv).toBe("Name,Age,Note\nX,0,");
  });
});
