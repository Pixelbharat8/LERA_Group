"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Renewal {
  id: string;
  studentId: string;
  classId?: string;
  centerId?: string;
  endDate?: string;
  status: "PENDING" | "CONTACTED" | "RENEWED" | "DECLINED" | "CHURNED";
  reminderDate?: string;
  notes?: string;
}

interface Student {
  id: string;
  fullname?: string;
  name?: string;
  studentCode?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  RENEWED: "bg-green-100 text-green-800",
  DECLINED: "bg-gray-100 text-gray-600",
  CHURNED: "bg-red-100 text-red-800",
};

export default function RenewalsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, userCenterId, shouldFilterByCenter]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const renewalsUrl = buildCenterFilterUrl("/api/renewals", shouldFilterByCenter ? userCenterId : null);
      const [renewalsData, studentsData, statsData] = await Promise.all([
        apiFetch(renewalsUrl).catch(() => []),
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/renewals/stats").catch(() => null),
      ]);
      setRenewals(Array.isArray(renewalsData) ? renewalsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setStats(statsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load renewals");
    } finally {
      setLoading(false);
    }
  };

  const studentById = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const studentLabel = (id: string) => {
    const s = studentById.get(id);
    if (!s) return "Student";
    return s.fullname || s.name || s.studentCode || "Student";
  };

  async function generate() {
    setGenerating(true);
    setError(null);
    setInfo(null);
    try {
      const res: any = await apiFetch(
        buildCenterFilterUrl("/api/renewals/generate?daysAhead=30", shouldFilterByCenter ? userCenterId : null),
        { method: "POST" }
      );
      setInfo(`Scanned ${res?.scanned ?? 0} ending enrolment(s) — created ${res?.created ?? 0} new renewal(s).`);
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Failed to generate renewals");
    } finally {
      setGenerating(false);
    }
  }

  async function action(id: string, path: string) {
    setError(null);
    try {
      await apiFetch(`/api/renewals/${id}/${path}`, { method: "POST", body: JSON.stringify({}) });
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Action failed");
    }
  }

  const daysLeft = (d?: string) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link>
            <span>/</span>
            <span className="text-gray-900">Renewals</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🔁 Renewals &amp; Retention</h1>
          <p className="text-gray-500">Catch students before their course ends and track re-enrolment</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {generating ? "Scanning…" : "🔍 Find renewals due (30 days)"}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{info}</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Pending", value: stats?.pending ?? 0, icon: "⏳", bg: "bg-yellow-100" },
          { label: "Contacted", value: stats?.contacted ?? 0, icon: "📞", bg: "bg-blue-100" },
          { label: "Renewed", value: stats?.renewed ?? 0, icon: "✅", bg: "bg-green-100" },
          { label: "Churned", value: stats?.churned ?? 0, icon: "❌", bg: "bg-red-100" },
          { label: "Renewal rate", value: `${stats?.renewalRate ?? 0}%`, icon: "📈", bg: "bg-indigo-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 ${s.bg} rounded-lg flex items-center justify-center text-xl`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course ends</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : renewals.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                No renewals yet — click “Find renewals due” to scan for ending enrolments.
              </td></tr>
            ) : (
              renewals.map((r) => {
                const dl = daysLeft(r.endDate);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{studentLabel(r.studentId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {r.endDate || "—"}
                      {dl !== null && (
                        <span className={`ml-2 text-xs ${dl < 0 ? "text-red-600" : dl <= 14 ? "text-orange-600" : "text-gray-400"}`}>
                          {dl < 0 ? `${-dl}d overdue` : `in ${dl}d`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {(r.status === "PENDING" || r.status === "CONTACTED") ? (
                        <>
                          {r.status === "PENDING" && (
                            <button onClick={() => action(r.id, "contacted")} className="text-blue-600 hover:text-blue-800 mr-3">Contacted</button>
                          )}
                          <button onClick={() => action(r.id, "renewed")} className="text-green-600 hover:text-green-800 mr-3">Renewed</button>
                          <button onClick={() => action(r.id, "declined")} className="text-gray-500 hover:text-gray-700 mr-3">Declined</button>
                          <button onClick={() => action(r.id, "churned")} className="text-red-600 hover:text-red-800">Churned</button>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
