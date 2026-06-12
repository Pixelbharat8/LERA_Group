"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/Toast";

/**
 * Gamification leaderboard with inline award / deduct actions.
 *
 * Reads the global leaderboard (`GET /api/student-points/leaderboard`) and
 * exposes two PATCH endpoints per row:
 *   - `PATCH /api/student-points/student/{studentId}/add?points=N&reason=...`
 *   - `PATCH /api/student-points/student/{studentId}/deduct?points=N&reason=...`
 *
 * Both writes are audit-logged on the backend (see
 * `StudentPointsController` / `JdbcAuditWriter`).
 */

interface StudentPointsRow {
  id: string;
  studentId: string;
  studentName?: string | null;
  centerId?: string | null;
  totalPoints: number;
  currentLevel?: number | null;
  currentRank?: string | null;
  experiencePoints?: number | null;
  currentStreak?: number | null;
  longestStreak?: number | null;
  lastEarnedAt?: string | null;
}

type Action = "award" | "deduct";

export default function StudentPointsAdminPage() {
  const [rows, setRows] = React.useState<StudentPointsRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [modal, setModal] = React.useState<{ row: StudentPointsRow; action: Action } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/student-points/leaderboard");
      const arr: StudentPointsRow[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : [];
      setRows(arr);
    } catch (e: any) {
      setError(e?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.studentId.toLowerCase().includes(needle) ||
        (r.studentName ?? "").toLowerCase().includes(needle) ||
        (r.currentRank ?? "").toLowerCase().includes(needle)
    );
  }, [rows, search]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏅 Student Points</h1>
          <p className="text-gray-600 mt-1">
            Gamification leaderboard. Award or deduct points with a reason —
            every change is recorded in the audit log.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by student / rank…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg w-64 text-sm"
          />
          <button
            onClick={() => void load()}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">#</th>
                <th className="px-4 py-2 text-left font-semibold">Student</th>
                <th className="px-4 py-2 text-right font-semibold">Total</th>
                <th className="px-4 py-2 text-right font-semibold">Level</th>
                <th className="px-4 py-2 text-left font-semibold">Rank</th>
                <th className="px-4 py-2 text-right font-semibold">XP</th>
                <th className="px-4 py-2 text-right font-semibold">Streak</th>
                <th className="px-4 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">
                        {row.studentName || row.studentId.slice(0, 8) + "…"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{row.studentId}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {row.totalPoints?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.currentLevel ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-700">{row.currentRank ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.experiencePoints ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.currentStreak ?? 0}
                      {row.longestStreak ? (
                        <span className="text-gray-400"> / {row.longestStreak}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => setModal({ row, action: "award" })}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded mr-1"
                      >
                        ➕ Award
                      </button>
                      <button
                        onClick={() => setModal({ row, action: "deduct" })}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
                      >
                        ➖ Deduct
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <PointsAdjustModal
          row={modal.row}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function PointsAdjustModal({
  row,
  action,
  onClose,
  onDone,
}: {
  row: StudentPointsRow;
  action: Action;
  onClose: () => void;
  onDone: () => void;
}) {
  const [points, setPoints] = React.useState<number>(10);
  const [reason, setReason] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const isAward = action === "award";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!points || points < 1) return;
    setSubmitting(true);
    try {
      const params = new URLSearchParams({ points: String(points) });
      if (reason.trim()) params.set("reason", reason.trim());
      await apiFetch(
        `/api/student-points/student/${row.studentId}/${isAward ? "add" : "deduct"}?${params}`,
        { method: "PATCH" }
      );
      toast(
        isAward
          ? `Awarded ${points} pts to ${row.studentName || row.studentId.slice(0, 8)}`
          : `Deducted ${points} pts from ${row.studentName || row.studentId.slice(0, 8)}`,
        "success"
      );
      onDone();
    } catch (e: any) {
      toast(e?.message || "Adjustment failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold">
            {isAward ? "➕ Award points" : "➖ Deduct points"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Current balance:&nbsp;
            <span className="font-semibold">
              {(row.totalPoints ?? 0).toLocaleString()}
            </span>
            &nbsp;pts
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Points</span>
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Reason{" "}
            <span className="text-gray-400 text-xs font-normal">
              (recorded in audit log)
            </span>
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isAward
                ? "e.g. Top of class quiz"
                : "e.g. Disruptive behaviour in class"
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={
              isAward
                ? "px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                : "px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60"
            }
            disabled={submitting || !points || points < 1}
          >
            {submitting ? "Saving…" : isAward ? "Award" : "Deduct"}
          </button>
        </div>
      </form>
    </div>
  );
}
