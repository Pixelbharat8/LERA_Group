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

function valueFor<T>(row: T, col: CsvColumn<T>): string {
  const v = typeof col.key === "function" ? col.key(row) : (row as Record<string, unknown>)[col.key as string];
  return v == null ? "" : String(v);
}

/**
 * Export as an Excel-openable .xls (an HTML table — no library, so it adds no bundle
 * weight and trips no `npm audit` advisory the way SheetJS does). Excel opens it as a
 * worksheet with real columns; UTF-8 keeps Vietnamese names intact. Excel may show a
 * one-time "format differs from extension" prompt — click Yes.
 */
export function exportToExcel<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  if (typeof window === "undefined") return;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const head = columns
    .map((c) => `<th style="background:#1e40af;color:#fff;text-align:left;padding:4px">${esc(c.label)}</th>`)
    .join("");
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(valueFor(r, c))}</td>`).join("")}</tr>`)
    .join("");
  const html =
    `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head>` +
    `<body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob(["﻿" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
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
