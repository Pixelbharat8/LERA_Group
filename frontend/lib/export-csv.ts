/**
 * Reusable CSV export for dashboard data tables.
 *
 * `toCsv` builds an RFC-4180-ish CSV string (quotes/commas/newlines escaped) — pure and
 * testable. `exportToCsv` prepends a UTF-8 BOM (so Excel reads accented Vietnamese names
 * correctly) and triggers a browser download. Generalizes the one-off exporter that only
 * the payments page had, so any list view can offer "Export CSV".
 */

export type CsvColumn<T> = { key: keyof T | ((row: T) => unknown); label: string };

function cell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => cell(c.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => cell(typeof c.key === "function" ? c.key(row) : (row as Record<string, unknown>)[c.key as string]))
      .join(",")
  );
  return [header, ...body].join("\n");
}

export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  if (typeof window === "undefined") return;
  const csv = "﻿" + toCsv(rows, columns); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** `students_2026-06-13.csv` — dated filename for an export. */
export function datedFilename(base: string): string {
  // Caller passes the date to keep this pure/SSR-safe; default to today on the client.
  const d = typeof window !== "undefined" ? new Date().toISOString().split("T")[0] : "";
  return d ? `${base}_${d}` : base;
}
