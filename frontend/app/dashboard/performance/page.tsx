"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter } from "../../hooks/useUserCenter";

type Tab = "mine" | "manage";
interface Review {
  id: string; employeeId: string; employeeName?: string; reviewerName?: string;
  period?: string; reviewDate?: string; overallRating?: number; status: string;
  strengths?: string; improvements?: string; goals?: string;
}
interface User { id: string; fullName?: string; name?: string; }

const STATUS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", SUBMITTED: "bg-blue-100 text-blue-800", ACKNOWLEDGED: "bg-green-100 text-green-800",
};

export default function PerformancePage() {
  const { userId, centerId, loading: userLoading } = useUserCenter();
  const [tab, setTab] = useState<Tab>("mine");
  const [mine, setMine] = useState<Review[]>([]);
  const [all, setAll] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", period: "", overallRating: 3, strengths: "", improvements: "", goals: "" });

  useEffect(() => {
    if (!userLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, userId]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [m, a, u] = await Promise.all([
        userId ? apiFetch(`/api/performance-reviews/employee/${userId}`).catch(() => []) : Promise.resolve([]),
        apiFetch(`/api/performance-reviews`).catch(() => []),
        apiFetch(`/api/users`).catch(() => []),
      ]);
      setMine(Array.isArray(m) ? m : []);
      setAll(Array.isArray(a) ? a : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e: any) { setError(e?.message || "Failed to load reviews"); }
    finally { setLoading(false); }
  }

  const userName = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.fullName || u.name || ""));
    return map;
  }, [users]);

  async function createReview() {
    if (!form.employeeId || !form.period) { setError("Pick an employee and a period"); return; }
    setError(null);
    try {
      await apiFetch("/api/performance-reviews", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          employeeName: userName.get(form.employeeId) || null,
          reviewerId: userId, period: form.period,
          reviewDate: new Date().toISOString().split("T")[0],
          overallRating: Number(form.overallRating),
          strengths: form.strengths, improvements: form.improvements, goals: form.goals,
          status: "SUBMITTED", centerId,
        }),
      });
      setShowForm(false);
      setForm({ employeeId: "", period: "", overallRating: 3, strengths: "", improvements: "", goals: "" });
      await load();
    } catch (e: any) { setError(e?.message || "Failed to create review (manager only)"); }
  }

  async function acknowledge(id: string) {
    try { await apiFetch(`/api/performance-reviews/${id}/acknowledge`, { method: "POST", body: "{}" }); await load(); }
    catch (e: any) { setError(e?.message || "Failed"); }
  }

  const stars = (n?: number) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "—");
  const rows = tab === "mine" ? mine : all;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="text-gray-900">Performance</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">⭐ Performance Reviews</h1>
          <p className="text-gray-500">Appraisals and development goals</p>
        </div>
        {tab === "manage" && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">➕ New review</button>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2 border-b border-gray-200">
        {([["mine", "🙋 My Reviews"], ["manage", "👥 Team Reviews"]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === k ? "bg-white border border-b-white border-gray-200 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
        ))}
      </div>

      {loading ? <div className="text-center text-gray-500 py-10">Loading…</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tab === "mine" ? "Period" : "Employee"}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tab === "mine" ? "Reviewer" : "Period"}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{tab === "mine" ? "Action" : ""}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No reviews.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{tab === "mine" ? (r.period || "—") : (r.employeeName || userName.get(r.employeeId) || "Employee")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{tab === "mine" ? (r.reviewerName || "—") : (r.period || "—")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-amber-500">{stars(r.overallRating)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${STATUS[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {tab === "mine" && r.status === "SUBMITTED" && <button onClick={() => acknowledge(r.id)} className="text-sm text-green-600 hover:text-green-800">Acknowledge</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3"><h2 className="text-base font-semibold">New Performance Review</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button></header>
            <div className="space-y-3 px-5 py-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee *</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm">
                  <option value="">— select —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.name || u.id}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Period (e.g. 2026-Q2)" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <select value={form.overallRating} onChange={(e) => setForm({ ...form, overallRating: Number(e.target.value) })} className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>
              <textarea placeholder="Strengths" rows={2} value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <textarea placeholder="Areas to improve" rows={2} value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <textarea placeholder="Goals" rows={2} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3"><button onClick={() => setShowForm(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button><button onClick={createReview} className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">Save &amp; submit</button></footer>
          </div>
        </div>
      )}
    </div>
  );
}
