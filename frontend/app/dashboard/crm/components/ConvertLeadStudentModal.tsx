"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface StudentRow {
  id: string;
  fullname?: string;
  studentCode?: string;
}

export function ConvertLeadStudentModal({
  open,
  onClose,
  onConfirm,
  centerId,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (studentId: string | null) => void;
  /** When set, search is restricted to this centre (recommended for convert flow). */
  centerId?: string | null;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StudentRow[]>([]);
  const [selected, setSelected] = useState<StudentRow | null>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setSelected(null);
    }
  }, [open]);

  const search = useCallback(async () => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const centreParam =
        centerId && centerId.length > 0 ? `&centerId=${encodeURIComponent(centerId)}` : "";
      const list = await apiFetch(
        `/api/students/search?q=${encodeURIComponent(term)}${centreParam}`,
      );
      setResults(Array.isArray(list) ? list : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [q, centerId]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [q, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-lg font-semibold mb-1">Convert lead</h2>
        <p className="text-sm text-gray-600 mb-4">
          Optionally link an existing student to copy informal placement scores into Academy. Search by name or student code (min 2 characters).{" "}
          <Link href="/dashboard/academy/students" className="text-blue-600 hover:underline whitespace-nowrap">
            Open student directory
          </Link>{" "}
          to create or verify a record first.
        </p>
        <input
          type="search"
          className="w-full border rounded-lg px-3 py-2 mb-2"
          placeholder="Search students…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        {loading && <p className="text-sm text-gray-500 mb-2">Searching…</p>}
        <ul className="border rounded-lg divide-y max-h-52 overflow-y-auto mb-4">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected?.id === s.id ? "bg-blue-50" : ""}`}
                onClick={() => setSelected(s)}
              >
                <span className="font-medium">{s.fullname || "Student"}</span>
                {s.studentCode && (
                  <span className="text-xs text-gray-500 ml-2 font-mono">{s.studentCode}</span>
                )}
              </button>
            </li>
          ))}
          {!loading && q.trim().length >= 2 && results.length === 0 && (
            <li className="px-3 py-4 text-sm text-gray-500 text-center">No matches.</li>
          )}
        </ul>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" className="px-4 py-2 border rounded-lg" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded-lg text-gray-700"
            onClick={() => {
              onConfirm(null);
              onClose();
            }}
          >
            Convert without student link
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onConfirm(selected.id);
                onClose();
              }
            }}
          >
            Convert &amp; link student
          </button>
        </div>
      </div>
    </div>
  );
}
