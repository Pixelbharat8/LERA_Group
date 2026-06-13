"use client";

import { useEffect, useRef, useState } from "react";
import { exportToCsv, exportToExcel, datedFilename, type CsvColumn } from "../../lib/export-csv";

type ExportMenuProps<T> = {
  /** base filename; the export date is appended automatically */
  filename: string;
  rows: T[];
  columns: CsvColumn<T>[];
  /** optional override for the trigger button classes */
  className?: string;
};

/**
 * "Export ▾" dropdown offering CSV and Excel (.xls) for a data table. Disabled when
 * there are no rows. Both formats are UTF-8 so Vietnamese names export correctly.
 */
export default function ExportMenu<T>({ filename, rows, columns, className }: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const disabled = rows.length === 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const run = (fn: typeof exportToCsv) => {
    fn(datedFilename(filename), rows, columns);
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={
          className ??
          "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        }
      >
        📤 Export ▾
      </button>
      {open && !disabled && (
        <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            type="button"
            onClick={() => run(exportToCsv)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            📄 CSV (.csv)
          </button>
          <button
            type="button"
            onClick={() => run(exportToExcel)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            📊 Excel (.xls)
          </button>
        </div>
      )}
    </div>
  );
}
