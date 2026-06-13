"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Cohort {
  cohort: string; total: number; active: number; completed: number; churned: number; retentionRate: number;
}

export default function CohortRetentionPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [rows, setRows] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    apiFetch(buildCenterFilterUrl("/api/reports/cohorts", shouldFilterByCenter ? centerId : null))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => setError(e?.message || "Failed to load cohort retention"))
      .finally(() => setLoading(false));
  }, [userLoading, centerId, shouldFilterByCenter]);

  const fmtMonth = (c: string) => {
    const [y, m] = c.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  const rateColor = (r: number) => (r >= 80 ? "bg-green-500" : r >= 60 ? "bg-amber-500" : "bg-red-500");

  const totalStudents = rows.reduce((s, r) => s + r.total, 0);
  const overall = totalStudents > 0 ? Math.round((rows.reduce((s, r) => s + r.active, 0) * 1000) / totalStudents) / 10 : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="text-gray-900">Cohort Retention</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📉 Cohort Retention</h1>
        <p className="text-gray-500">How each enrolment cohort is retained over time</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {loading ? <div className="text-center text-gray-500 py-10">Loading…</div> : rows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">No enrolment data yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-xs uppercase">Cohorts</h3><p className="text-2xl font-bold">{rows.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
              <h3 className="text-gray-500 text-xs uppercase">Total enrolled</h3><p className="text-2xl font-bold">{totalStudents}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
              <h3 className="text-gray-500 text-xs uppercase">Still active</h3><p className="text-2xl font-bold text-green-700">{rows.reduce((s, r) => s + r.active, 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500">
              <h3 className="text-gray-500 text-xs uppercase">Overall retention</h3><p className="text-2xl font-bold text-amber-700">{overall}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort (start month)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Churned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retention</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.cohort} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{fmtMonth(r.cohort)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{r.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-700">{r.active}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.completed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">{r.churned}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${rateColor(r.retentionRate)}`} style={{ width: `${r.retentionRate}%` }} />
                        </div>
                        <span className="text-sm font-medium">{r.retentionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
